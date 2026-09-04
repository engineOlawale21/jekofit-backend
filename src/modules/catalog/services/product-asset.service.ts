import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, promises as fs } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductAsset, ProductAssetStatus } from '../entities/product-asset.entity';
import { PRODUCT_IMAGE_QUEUE, ProductImageJobName } from '../queues/product-image.queue';

const signatures: Record<string, number[]> = { 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47], 'image/webp': [0x52, 0x49, 0x46, 0x46] };
@Injectable()
export class ProductAssetService {
  private readonly root: string;
  constructor(private readonly config: ConfigService, @InjectRepository(Product) private readonly products: Repository<Product>, @InjectRepository(ProductAsset) private readonly assets: Repository<ProductAsset>, @InjectQueue(PRODUCT_IMAGE_QUEUE) private readonly queue: Queue) { this.root = this.config.get('ASSET_STORAGE_DIR') || join(process.cwd(), 'storage'); }
  private assertEditor(userId: string) { const allowed = (this.config.get<string>('CATALOG_EDITOR_USER_IDS') || '').split(',').filter(Boolean); if (!allowed.includes(userId)) throw new ForbiddenException('Catalog upload access is required'); }
  async upload(userId: string, productId: string, file: { buffer: Buffer; mimetype: string; size: number; originalname: string }) {
    this.assertEditor(userId);
    if (!file || !signatures[file.mimetype] || file.size > 12 * 1024 * 1024) throw new BadRequestException('Use a JPEG, PNG or WebP image up to 12 MB');
    const magic = signatures[file.mimetype]; if (!magic.every((byte, index) => file.buffer[index] === byte)) throw new BadRequestException('Image content does not match its declared type');
    if (!await this.products.exists({ where: { id: productId } })) throw new NotFoundException('Product not found');
    const asset = await this.assets.save(this.assets.create({ productId, originalKey: `${randomUUID()}.${file.mimetype.split('/')[1]}`, contentType: file.mimetype, byteSize: file.size, width: null, height: null, status: ProductAssetStatus.Queued, variants: {}, failureReason: null }));
    const folder = join(this.root, 'products', productId, 'originals'); if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
    await fs.writeFile(join(folder, asset.originalKey), file.buffer, { mode: 0o600 });
    await this.queue.add(ProductImageJobName.PROCESS, { assetId: asset.id });
    return { id: asset.id, status: asset.status };
  }
  private async find(assetId: string) { const asset = await this.assets.findOne({ where: { id: assetId } }); if (!asset) throw new NotFoundException('Asset not found'); return asset; }
  async get(userId: string, assetId: string) { this.assertEditor(userId); return this.find(assetId); }
  async process(assetId: string) {
    const asset = await this.find(assetId); if (asset.status === ProductAssetStatus.Ready) return;
    asset.status = ProductAssetStatus.Processing; await this.assets.save(asset);
    try {
      let sharp: any; try { sharp = require('sharp'); } catch { throw new ServiceUnavailableException('Image processor is not installed'); }
      const original = join(this.root, 'products', asset.productId, 'originals', asset.originalKey); const metadata = await sharp(original).metadata();
      if (!metadata.width || !metadata.height || metadata.width * metadata.height > 40_000_000) throw new BadRequestException('Image dimensions are unsafe');
      const folder = join(this.root, 'products', asset.productId, asset.id); if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
      const variants: Record<string, { url: string; width: number; height: number }> = {};
      const publicBase = (this.config.get<string>('PUBLIC_API_URL') || 'http://localhost:3001').replace(/\/$/, '');
      for (const width of [400, 800, 1600]) { const filename = `${width}.webp`; const result = await sharp(original).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: width === 400 ? 72 : 82 }).toFile(join(folder, filename)); variants[String(width)] = { url: `${publicBase}/media/products/${asset.productId}/${asset.id}/${filename}`, width: result.width, height: result.height }; }
      asset.width = metadata.width; asset.height = metadata.height; asset.variants = variants; asset.status = ProductAssetStatus.Ready; asset.failureReason = null; await this.assets.save(asset);
      const product = await this.products.findOneByOrFail({ id: asset.productId }); product.imageUrls = [variants['800'].url, ...product.imageUrls.filter((url) => !url.includes(`/media/products/${asset.productId}/`))]; await this.products.save(product);
    } catch (error) { asset.status = ProductAssetStatus.Failed; asset.failureReason = error instanceof Error ? error.message : 'Image processing failed'; await this.assets.save(asset); throw error; }
  }
}
