import { NotFoundException } from '@nestjs/common';
import { DesignService } from './design.service';

describe('DesignService version history', () => {
  const designs = { findOne: jest.fn() };
  const versions = { find: jest.fn(), findOne: jest.fn() };
  const service = new DesignService({} as any, designs as any, versions as any, { add: jest.fn() } as any);

  beforeEach(() => jest.clearAllMocks());

  it('lists versions only after confirming design ownership', async () => {
    designs.findOne.mockResolvedValue({ id: 'design-1', userId: 'user-1' });
    versions.find.mockResolvedValue([{ designId: 'design-1', version: 2 }]);
    await expect(service.listVersions('user-1', 'design-1')).resolves.toEqual([{ designId: 'design-1', version: 2 }]);
    expect(versions.find).toHaveBeenCalledWith({ where: { designId: 'design-1' }, order: { version: 'DESC' }, take: 50 });
  });

  it('rejects history access for an unknown or unowned design', async () => {
    designs.findOne.mockResolvedValue(null);
    await expect(service.listVersions('user-1', 'design-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(versions.find).not.toHaveBeenCalled();
  });

  it('restores a snapshot through the normal save and render pipeline', async () => {
    designs.findOne.mockResolvedValue({ id: 'design-1', userId: 'user-1', isFavourite: true });
    versions.findOne.mockResolvedValue({
      name: 'Big Dreams', productName: 'Jekofit T-Shirt', garmentColour: '#ffffff', document: { surfaces: [] },
    });
    const save = jest.spyOn(service, 'save').mockResolvedValue({ id: 'design-1' } as any);
    await service.restoreVersion('user-1', 'design-1', 3);
    expect(save).toHaveBeenCalledWith('user-1', {
      name: 'Big Dreams', productName: 'Jekofit T-Shirt', garmentColour: '#ffffff', canvas: { surfaces: [] }, isFavourite: true,
    }, 'design-1');
  });
});
