import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { DesignController } from './controllers/design.controller';
import { Design } from './entities/design.entity';
import { DesignService } from './services/design.service';
import { DesignRenderJob } from './entities/design-render-job.entity';
import { DesignRenderProcessor } from './processors/design-render.processor';
import { DESIGN_RENDER_QUEUE } from './queues/design-render.queue';
@Module({ imports: [TypeOrmModule.forFeature([Design, DesignRenderJob]), BullModule.registerQueue({ name: DESIGN_RENDER_QUEUE, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2_000 }, removeOnComplete: true, removeOnFail: { age: 7 * 24 * 3600 } } })], controllers: [DesignController], providers: [DesignService, DesignRenderProcessor] }) export class DesignModule {}
