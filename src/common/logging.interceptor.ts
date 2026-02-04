import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl } = req;
    const requestId = (req as any).requestId;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const status = req.res?.statusCode;
          this.logger.log(`${method} ${originalUrl} ${status} ${ms}ms request_id=${requestId}`);
        },
        error: (err) => {
          const ms = Date.now() - start;
          const status = req.res?.statusCode;
          this.logger.error(
            `${method} ${originalUrl} ${status} ${ms}ms request_id=${requestId} error=${err?.message}`,
          );
        },
      }),
    );
  }
}
