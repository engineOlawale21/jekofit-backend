import { Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Auth } from '../../auth/entities/auth.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProductAssetService } from '../services/product-asset.service';
@Controller('catalog') @UseGuards(JwtAuthGuard)
export class ProductAssetController {
  constructor(private readonly assets: ProductAssetService) {}
  @Post('products/:productId/assets') @Throttle({ default: { limit: 10, ttl: 60 } }) @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 12 * 1024 * 1024, files: 1 } }))
  upload(@CurrentUser() user: Auth, @Param('productId') productId: string, @UploadedFile() file: any) { return this.assets.upload(user.id, productId, file); }
  @Get('assets/:id') get(@CurrentUser() user: Auth, @Param('id') id: string) { return this.assets.get(user.id, id); }
}
