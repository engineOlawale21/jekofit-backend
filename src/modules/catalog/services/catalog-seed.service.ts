import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';

/** Development-only seed data. Production catalog changes must arrive through an admin/import workflow. */
@Injectable()
export class CatalogSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(ProductVariant) private readonly variants: Repository<ProductVariant>,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'production' || await this.products.count()) return;
    const product = await this.products.save(this.products.create({
      legacyId: 'p-001', name: 'Essential Fitted Tee', slug: 'essential-fitted-tee', category: 'women',
      description: '100% cotton women regular fit white t-shirt. Soft, breathable, and durable fabric for daily comfort.',
      imageUrls: ['/images/product-tshirt.jpg'], tags: ['trending'], isPublished: true,
    }));
    const colours = ['White', 'Black', 'Sage'];
    const sizes = ['XS', 'S', 'M', 'L', 'XL'];
    await this.variants.save(colours.flatMap((colour) => sizes.map((size) => this.variants.create({
      productId: product.id, sku: `EFT-${colour.slice(0, 2).toUpperCase()}-${size}`, colour, size,
      price: '29.99', currency: 'NGN', stockQuantity: 50, isActive: true,
    }))));
  }
}
