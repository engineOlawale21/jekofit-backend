import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListProductsDto } from '../dto/list-products.dto';
import { Product } from '../entities/product.entity';

@Injectable()
export class CatalogService {
  constructor(@InjectRepository(Product) private readonly products: Repository<Product>) {}

  async list(query: ListProductsDto) {
    const builder = this.products
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant', 'variant.isActive = :active', { active: true })
      .where('product.isPublished = :published', { published: true });

    if (query.category) builder.andWhere('product.category = :category', { category: query.category });
    if (query.query) {
      builder.andWhere('(product.name ILIKE :query OR product.description ILIKE :query)', { query: `%${query.query.trim()}%` });
    }

    if (query.tag) builder.andWhere('product.tags @> :tag::jsonb', { tag: JSON.stringify([query.tag]) });
    if (query.colour) builder.andWhere('LOWER(variant.colour) = LOWER(:colour)', { colour: query.colour });
    if (query.size) builder.andWhere('LOWER(variant.size) = LOWER(:size)', { size: query.size });
    if (query.minPrice !== undefined) builder.andWhere('variant.price >= :minPrice', { minPrice: query.minPrice });
    if (query.maxPrice !== undefined) builder.andWhere('variant.price <= :maxPrice', { maxPrice: query.maxPrice });

    if (query.sort === 'name') builder.orderBy('product.name', 'ASC');
    else if (query.sort === 'price_asc') builder.orderBy('variant.price', 'ASC');
    else if (query.sort === 'price_desc') builder.orderBy('variant.price', 'DESC');
    else builder.orderBy('product.createdAt', 'DESC');
    return builder.distinct(true).take(query.limit).getMany();
  }

  async categories() {
    const rows = await this.products.createQueryBuilder('product')
      .select('product.category', 'slug')
      .addSelect('COUNT(product.id)', 'productCount')
      .where('product.isPublished = :published', { published: true })
      .groupBy('product.category')
      .orderBy('product.category', 'ASC')
      .getRawMany<{ slug: string; productCount: string }>();
    return rows.map((row) => ({ slug: row.slug, name: row.slug.replace(/(^|[-_])\w/g, (value) => value.replace(/[-_]/, ' ').toUpperCase()), productCount: Number(row.productCount) }));
  }

  collections() {
    return [
      { slug: 'new-and-trending', name: 'New & Trending', tag: 'trending' },
      { slug: 'inspirations', name: 'Design Inspirations', tag: 'inspiration' },
      { slug: 'design-specials', name: 'Design Specials', tag: 'design-special' },
    ];
  }

  async collectionProducts(slug: string, limit = 24) {
    const collection = this.collections().find((item) => item.slug === slug);
    if (!collection) return null;
    return { ...collection, products: await this.list(Object.assign(new ListProductsDto(), { tag: collection.tag, limit })) };
  }

  async recommendations(productId: string, limit = 6) {
    const product = await this.products.findOne({ where: { id: productId, isPublished: true } });
    if (!product) return null;
    return this.products.createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant', 'variant.isActive = :active', { active: true })
      .where('product.isPublished = :published', { published: true })
      .andWhere('product.id != :productId', { productId })
      .andWhere('(product.category = :category OR product.tags ?| ARRAY[:...tags])', { category: product.category, tags: product.tags.length ? product.tags : ['__none__'] })
      .orderBy('CASE WHEN product.category = :category THEN 0 ELSE 1 END', 'ASC')
      .addOrderBy('product.createdAt', 'DESC')
      .take(Math.min(Math.max(limit, 1), 12))
      .getMany();
  }

  async sizeGuide(productId: string) {
    const product = await this.products.findOne({ where: { id: productId, isPublished: true }, relations: { variants: true } });
    if (!product) return null;
    const measurements: Record<string, { bodyLength: number; chest: number; sleeveLength: number }> = {
      XS: { bodyLength: 27, chest: 27, sleeveLength: 27 }, S: { bodyLength: 28, chest: 28, sleeveLength: 28 },
      M: { bodyLength: 29, chest: 29, sleeveLength: 29 }, L: { bodyLength: 30, chest: 30, sleeveLength: 30 },
      XL: { bodyLength: 31, chest: 31, sleeveLength: 31 }, XXL: { bodyLength: 32, chest: 32, sleeveLength: 32 },
    };
    const sizes = [...new Set(product.variants.filter((variant) => variant.isActive).map((variant) => variant.size))];
    return { productId, unit: 'in', sizes: sizes.map((size) => ({ size, ...(measurements[size.toUpperCase()] ?? {}) })) };
  }

  async getBySlug(slug: string) {
    return this.products.findOne({
      where: { slug, isPublished: true },
      relations: { variants: true },
    });
  }

  async getByLegacyId(legacyId: string) {
    return this.products.findOne({
      where: { legacyId, isPublished: true },
      relations: { variants: true },
    });
  }
}
