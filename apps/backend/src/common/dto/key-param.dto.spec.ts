import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ProjectFlagKeyParamDto,
  ProjectGroupKeyParamDto,
  ProjectKeyParamDto,
} from './key-param.dto';

describe('key param DTOs', () => {
  describe('ProjectKeyParamDto', () => {
    it('accepts valid projectKey', async () => {
      const dto = plainToInstance(ProjectKeyParamDto, {
        projectKey: 'demo-project',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('rejects whitespace-only projectKey', async () => {
      const dto = plainToInstance(ProjectKeyParamDto, {
        projectKey: '   ',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('projectKey');
    });

    it('rejects uppercase projectKey', async () => {
      const dto = plainToInstance(ProjectKeyParamDto, {
        projectKey: 'Demo-Project',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('projectKey');
    });

    it('rejects invalid characters in projectKey', async () => {
      const dto = plainToInstance(ProjectKeyParamDto, {
        projectKey: 'demo_project',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('projectKey');
    });

    it('rejects projectKey shorter than 3 characters', async () => {
      const dto = plainToInstance(ProjectKeyParamDto, {
        projectKey: 'ab',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('projectKey');
    });
  });

  describe('ProjectFlagKeyParamDto', () => {
    it('accepts valid projectKey and flagKey', async () => {
      const dto = plainToInstance(ProjectFlagKeyParamDto, {
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('rejects invalid flagKey', async () => {
      const dto = plainToInstance(ProjectFlagKeyParamDto, {
        projectKey: 'demo-project',
        flagKey: 'New_Checkout',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('flagKey');
    });
  });

  describe('ProjectGroupKeyParamDto', () => {
    it('accepts valid projectKey and groupKey', async () => {
      const dto = plainToInstance(ProjectGroupKeyParamDto, {
        projectKey: 'demo-project',
        groupKey: 'checkout',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('rejects invalid groupKey', async () => {
      const dto = plainToInstance(ProjectGroupKeyParamDto, {
        projectKey: 'demo-project',
        groupKey: 'Checkout_Group',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('groupKey');
    });
  });
});
