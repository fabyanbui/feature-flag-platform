import { IsString, Matches } from 'class-validator';
import { KEY_REGEX, KEY_VALIDATION_MESSAGE } from '../constants/api.constants';

export class ProjectKeyParamDto {
  @IsString()
  @Matches(KEY_REGEX, {
    message: `projectKey ${KEY_VALIDATION_MESSAGE}`,
  })
  projectKey!: string;
}

export class ProjectFlagKeyParamDto extends ProjectKeyParamDto {
  @IsString()
  @Matches(KEY_REGEX, {
    message: `flagKey ${KEY_VALIDATION_MESSAGE}`,
  })
  flagKey!: string;
}
