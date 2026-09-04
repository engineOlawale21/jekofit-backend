import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ProductAssetService } from '../services/product-asset.service';
import { PRODUCT_IMAGE_QUEUE, ProductImageJobName, ProcessProductImagePayload } from '../queues/product-image.queue';
@Processor(PRODUCT_IMAGE_QUEUE)
export class ProductImageProcessor {
  private readonly logger = new Logger(ProductImageProcessor.name);
  constructor(private readonly assets: ProductAssetService) {}
  @Process(ProductImageJobName.PROCESS) process(job: Job<ProcessProductImagePayload>) { return this.assets.process(job.data.assetId); }
  @OnQueueFailed() failed(job: Job<ProcessProductImagePayload>, error: Error) { this.logger.error(`Asset ${job.data.assetId} failed: ${error.message}`); }
}
