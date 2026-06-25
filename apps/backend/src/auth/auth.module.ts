import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CommonModule } from '../common/common.module';
import { DemoIdentityService } from './demo-identity.service';
import { DemoAuthenticationGuard } from './guards/demo-authentication.guard';
import { PermissionGuard } from './guards/permission.guard';

@Module({
  imports: [CommonModule],
  providers: [
    DemoIdentityService,
    {
      provide: APP_GUARD,
      useClass: DemoAuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
  exports: [DemoIdentityService],
})
export class AuthModule {}
