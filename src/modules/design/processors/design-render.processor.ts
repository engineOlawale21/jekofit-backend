import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { Design } from '../entities/design.entity';
import { DesignRenderJob, DesignRenderJobStatus } from '../entities/design-render-job.entity';
import { DESIGN_RENDER_QUEUE, DesignRenderJobName, PrepareDesignProofPayload } from '../queues/design-render.queue';

@Processor(DESIGN_RENDER_QUEUE)
export class DesignRenderProcessor {
  private readonly logger = new Logger(DesignRenderProcessor.name);
  constructor(@InjectRepository(DesignRenderJob) private readonly jobs: Repository<DesignRenderJob>, @InjectRepository(Design) private readonly designs: Repository<Design>) {}

  @Process(DesignRenderJobName.PREPARE_PROOF)
  async prepareProof(queueJob: Job<PrepareDesignProofPayload>) {
    const renderJob = await this.jobs.findOne({ where: { id: queueJob.data.renderJobId }, relations: { design: true } });
    if (!renderJob || renderJob.status === DesignRenderJobStatus.Ready) return;
    renderJob.status = DesignRenderJobStatus.Processing;
    await this.jobs.save(renderJob);
    try {
      // Rendering providers belong here. This worker deliberately owns the expensive
      // proof-generation boundary so requests never process artwork synchronously.
      if (!renderJob.canvasSnapshot || Object.keys(renderJob.canvasSnapshot).length === 0) throw new Error('Design canvas is empty');
      const design = renderJob.design;
      if (design.renderVersion !== renderJob.version) return; // a newer save superseded this proof
      design.renderStatus = 'ready';
      await this.designs.save(design);
      renderJob.status = DesignRenderJobStatus.Ready;
      await this.jobs.save(renderJob);
    } catch (error) {
      renderJob.status = DesignRenderJobStatus.Failed;
      renderJob.failureReason = error instanceof Error ? error.message : 'Design proof failed';
      await this.jobs.save(renderJob);
      if (renderJob.design?.renderVersion === renderJob.version) {
        renderJob.design.renderStatus = 'failed';
        await this.designs.save(renderJob.design);
      }
      throw error;
    }
  }

  @OnQueueFailed()
  onFailed(job: Job<PrepareDesignProofPayload>, error: Error) { this.logger.error(`Design render job ${job.data.renderJobId} failed: ${error.message}`); }
}
