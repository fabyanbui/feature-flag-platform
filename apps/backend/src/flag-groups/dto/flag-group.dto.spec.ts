import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AssignFlagGroupDto } from './assign-flag-group.dto';
import { CreateFlagGroupDto } from './create-flag-group.dto';
import { FlagGroupQueryDto } from './flag-group-query.dto';
import { UpdateFlagGroupConfigDto } from './update-flag-group-config.dto';
import { UpdateFlagGroupDto } from './update-flag-group.dto';

describe('flag-group DTOs', () => {
  it('accepts a valid group create request', async () => {
    const dto = plainToInstance(CreateFlagGroupDto, {
      key: 'checkout',
      name: 'Checkout flags',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects an invalid group key', async () => {
    const dto = plainToInstance(CreateFlagGroupDto, {
      key: 'Checkout Group',
      name: 'Checkout flags',
    });

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'key',
        }),
      ]),
    );
  });

  it('rejects a group name longer than 120 characters', async () => {
    const dto = plainToInstance(UpdateFlagGroupDto, {
      name: 'x'.repeat(121),
    });

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'name',
        }),
      ]),
    );
  });

  it('requires a boolean group kill-switch value', async () => {
    const dto = plainToInstance(UpdateFlagGroupConfigDto, {
      environmentKey: 'production',
      killSwitch: 'true',
    });

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'killSwitch',
        }),
      ]),
    );
  });

  it('accepts a valid assignment request', async () => {
    const dto = plainToInstance(AssignFlagGroupDto, {
      groupKey: 'checkout',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('transforms and validates pagination with an environment key', async () => {
    const dto = plainToInstance(FlagGroupQueryDto, {
      search: 'check',
      environmentKey: 'production',
      limit: '25',
      offset: '10',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.limit).toBe(25);
    expect(dto.offset).toBe(10);
  });
});
