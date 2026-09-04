import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../catalog/entities/product.entity';
import { FavouriteController } from './controllers/favourite.controller';
import { ProductFavourite } from './entities/product-favourite.entity';
import { FavouriteService } from './services/favourite.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductFavourite, Product])],
  controllers: [FavouriteController],
  providers: [FavouriteService],
})
export class FavouriteModule {}
