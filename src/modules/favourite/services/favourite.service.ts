import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../catalog/entities/product.entity';
import { ProductFavourite } from '../entities/product-favourite.entity';

@Injectable()
export class FavouriteService {
  constructor(
    @InjectRepository(ProductFavourite) private readonly favourites: Repository<ProductFavourite>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  async list(userId: string) {
    return this.favourites.find({
      where: { userId },
      relations: { product: { variants: true } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async add(userId: string, productId: string) {
    const product = await this.products.findOne({ where: { id: productId, isPublished: true } });
    if (!product) throw new NotFoundException('Product not found');
    await this.favourites.createQueryBuilder().insert().into(ProductFavourite)
      .values({ userId, productId }).orIgnore().execute();
    return { productId, isFavourite: true };
  }

  async remove(userId: string, productId: string) {
    await this.favourites.delete({ userId, productId });
    return { productId, isFavourite: false };
  }
}
