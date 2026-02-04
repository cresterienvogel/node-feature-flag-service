import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ApiKeysController } from './api-keys.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [AuditModule],
  controllers: [ApiKeysController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
