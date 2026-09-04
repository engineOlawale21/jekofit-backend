import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { ProductionJob, ProductionJobStatus } from '../entities/production-job.entity';
import { PRODUCTION_QUEUE, ProductionJobName, StartProductionPayload } from '../queues/production.queue';

@Processor(PRODUCTION_QUEUE)
export class ProductionProcessor {
  private readonly logger = new Logger(ProductionProcessor.name);
  constructor(@InjectRepository(ProductionJob) private readonly jobs: Repository<ProductionJob>) {}

  @Process(ProductionJobName.START)
  async start(job: Job<StartProductionPayload>) {
    const record = await this.jobs.findOne({ where: { id: job.data.productionJobId } });
    if (!record || record.status !== ProductionJobStatus.Queued) return;
    record.status = ProductionJobStatus.InProduction;
    await this.jobs.save(record);
    this.logger.log(`Production job ${record.id} is ready for fulfilment`);
  }

  @OnQueueFailed()
  onFailed(job: Job<StartProductionPayload>, error: Error) {
    this.logger.error(`Production job ${job.data.productionJobId} failed: ${error.message}`);
  }
}
