import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    example: 'demo-project',
  })
  key!: string;

  @ApiProperty({
    example: 'Demo Project',
  })
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
