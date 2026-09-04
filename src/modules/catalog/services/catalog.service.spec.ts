import { CatalogService } from './catalog.service';

describe('CatalogService screen contracts', () => {
  const repository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const service = new CatalogService(repository as any);

  beforeEach(() => jest.clearAllMocks());

  it('exposes the curated collections used by the storefront', () => {
    expect(service.collections()).toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: 'new-and-trending', tag: 'trending' }),
      expect.objectContaining({ slug: 'inspirations', tag: 'inspiration' }),
      expect.objectContaining({ slug: 'design-specials', tag: 'design-special' }),
    ]));
  });

  it('returns only the active product sizes in a size guide', async () => {
    repository.findOne.mockResolvedValue({
      id: 'product-1',
      variants: [
        { size: 'S', isActive: true },
        { size: 'M', isActive: true },
        { size: 'S', isActive: true },
        { size: 'XL', isActive: false },
      ],
    });

    await expect(service.sizeGuide('product-1')).resolves.toEqual({
      productId: 'product-1',
      unit: 'in',
      sizes: [
        { size: 'S', bodyLength: 28, chest: 28, sleeveLength: 28 },
        { size: 'M', bodyLength: 29, chest: 29, sleeveLength: 29 },
      ],
    });
  });

  it('returns null for an unknown product size guide', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.sizeGuide('missing')).resolves.toBeNull();
  });
});
