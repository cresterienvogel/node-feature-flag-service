import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/public.decorator';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers['x-api-key'] as string | undefined;
    if (!apiKey) throw new UnauthorizedException('Missing X-API-Key');

    const rootKey = process.env.ROOT_API_KEY;
    if (rootKey && apiKey === rootKey) {
      req.apiKeyId = null;
      return true;
    }

    const keyRecord = await this.authService.validateApiKey(apiKey);
    if (!keyRecord) throw new UnauthorizedException('Invalid API key');

    req.apiKeyId = keyRecord.id;
    return true;
  }
}
