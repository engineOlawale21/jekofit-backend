import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionJob } from './entities/production-job.entity';
import { ProductionProcessor } from './processors/production.processor';
import { PRODUCTION_QUEUE } from './queues/production.queue';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionJob]), BullModule.registerQueue({ name: PRODUCTION_QUEUE, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2_000 }, removeOnComplete: true, removeOnFail: { age: 7 * 24 * 3600 } } })],
  providers: [ProductionProcessor],
  exports: [BullModule],
})
export class ProductionModule {}
