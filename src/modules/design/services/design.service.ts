import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SaveDesignDto } from '../dto/save-design.dto';
import { Design } from '../entities/design.entity';
import { DesignRenderJob, DesignRenderJobStatus } from '../entities/design-render-job.entity';
import { DESIGN_RENDER_QUEUE, DesignRenderJobName } from '../queues/design-render.queue';
import { DesignVersion } from '../entities/design-version.entity';
@Injectable()
export class DesignService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Design) private readonly designs: Repository<Design>,
    @InjectRepository(DesignVersion) private readonly versions: Repository<DesignVersion>,
    @InjectQueue(DESIGN_RENDER_QUEUE) private readonly renderQueue: Queue,
  ) {}
  list(userId: string) { return this.designs.find({ where: { userId }, order: { updatedAt: 'DESC' }, take: 50 }); }
  async get(userId: string, id: string) {
    const design = await this.designs.findOne({ where: { id, userId } });
    if (!design) throw new NotFoundException('Design not found');
    return design;
  }
  async renderStatus(userId: string, id: string) {
    const design = await this.get(userId, id);
    return { designId: design.id, version: design.renderVersion, status: design.renderStatus, updatedAt: design.updatedAt };
  }
  async listVersions(userId: string, id: string) {
    await this.get(userId, id);
    return this.versions.find({ where: { designId: id }, order: { version: 'DESC' }, take: 50 });
  }
  async restoreVersion(userId: string, id: string, version: number) {
    const current = await this.get(userId, id);
    const snapshot = await this.versions.findOne({ where: { designId: id, version } });
    if (!snapshot) throw new NotFoundException('Design version not found');
    return this.save(userId, {
      name: snapshot.name,
      productName: snapshot.productName,
      garmentColour: snapshot.garmentColour,
      canvas: snapshot.document,
      isFavourite: current.isFavourite,
    }, id);
  }
  async duplicate(userId: string, id: string) {
    const source = await this.get(userId, id);
    return this.save(userId, {
      name: `${source.name} copy`.slice(0, 80),
      productName: source.productName,
      garmentColour: source.garmentColour,
      canvas: source.canvas,
      isFavourite: false,
    });
  }
  async save(userId: string, dto: SaveDesignDto, id?: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Design);
      const design = id ? await repository.findOne({ where: { id, userId } }) : repository.create({ userId });
      if (!design) throw new NotFoundException('Design not found');
      Object.assign(design, { ...dto, productName: dto.productName || design.productName, canvas: dto.canvas || {}, renderVersion: (design.renderVersion ?? 0) + 1, renderStatus: 'queued' });
      const saved = await repository.save(design);
      await manager.getRepository(DesignVersion).save(manager.getRepository(DesignVersion).create({
        designId: saved.id,
        version: saved.renderVersion,
        name: saved.name,
        productName: saved.productName,
        garmentColour: saved.garmentColour,
        document: saved.canvas,
      }));
      const renderJob = await manager.getRepository(DesignRenderJob).save(manager.getRepository(DesignRenderJob).create({ designId: saved.id, version: saved.renderVersion, status: DesignRenderJobStatus.Queued, canvasSnapshot: saved.canvas, failureReason: null }));
      return { designId: saved.id, renderJobId: renderJob.id };
    });
    await this.renderQueue.add(DesignRenderJobName.PREPARE_PROOF, { renderJobId: result.renderJobId });
    return this.designs.findOneOrFail({ where: { id: result.designId, userId } });
  }
  async remove(userId: string, id: string) { const result = await this.designs.delete({ id, userId }); if (!result.affected) throw new NotFoundException('Design not found'); return { id }; }
}
