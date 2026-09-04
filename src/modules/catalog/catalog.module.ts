import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './controllers/catalog.controller';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductAsset } from './entities/product-asset.entity';
import { BullModule } from '@nestjs/bull';
import { PRODUCT_IMAGE_QUEUE } from './queues/product-image.queue';
import { ProductAssetService } from './services/product-asset.service';
import { ProductImageProcessor } from './processors/product-image.processor';
import { ProductAssetController } from './controllers/product-asset.controller';
import { CatalogService } from './services/catalog.service';
import { CatalogSeedService } from './services/catalog-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariant, ProductAsset]), BullModule.registerQueue({ name: PRODUCT_IMAGE_QUEUE, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 3_000 }, removeOnComplete: true, removeOnFail: { age: 7 * 24 * 3600 } } })],
  controllers: [CatalogController, ProductAssetController],
  providers: [CatalogService, CatalogSeedService, ProductAssetService, ProductImageProcessor],
  exports: [CatalogService],
})
export class CatalogModule {}
