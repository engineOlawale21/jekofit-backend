import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../auth/decorators/public.decorator';
import { ListProductsDto } from '../dto/list-products.dto';
import { CatalogService } from '../services/catalog.service';

@Public()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  categories() { return this.catalog.categories(); }

  @Get('collections')
  collections() { return this.catalog.collections(); }

  @Get('collections/:slug/products')
  async collectionProducts(@Param('slug') slug: string, @Query('limit') limit?: string) {
    const collection = await this.catalog.collectionProducts(slug, limit ? Number(limit) : 24);
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  @Get('products/:productId/recommendations')
  async recommendations(@Param('productId') productId: string, @Query('limit') limit?: string) {
    const products = await this.catalog.recommendations(productId, limit ? Number(limit) : 6);
    if (!products) throw new NotFoundException('Product not found');
    return products;
  }

  @Get('size-guides/:productId')
  async sizeGuide(@Param('productId') productId: string) {
    const guide = await this.catalog.sizeGuide(productId);
    if (!guide) throw new NotFoundException('Product not found');
    return guide;
  }

  @Get('products')
  @Throttle({ default: { limit: 120, ttl: 60 } })
  list(@Query() query: ListProductsDto) {
    return this.catalog.list(query);
  }

  @Get('products/:slug')
  @Throttle({ default: { limit: 120, ttl: 60 } })
  async bySlug(@Param('slug') slug: string) {
    const product = await this.catalog.getBySlug(slug);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  @Get('products/by-legacy-id/:legacyId')
  @Throttle({ default: { limit: 120, ttl: 60 } })
  async byLegacyId(@Param('legacyId') legacyId: string) {
    const product = await this.catalog.getByLegacyId(legacyId);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
