export const PRODUCT_IMAGE_QUEUE = 'product-image';
export enum ProductImageJobName { PROCESS = 'process-product-image' }
export interface ProcessProductImagePayload { assetId: string }
