import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Observable } from "rxjs";

/** Attaches/propagates an X-Correlation-Id for tracing a request across logs. */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const correlationId = req.headers["x-correlation-id"] || randomUUID();
    req.correlationId = correlationId;
    res.setHeader("X-Correlation-Id", correlationId);
    return next.handle();
  }
}
