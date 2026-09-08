import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";

/**
 * Consistent error envelope for every error response:
 * { error: { code, message, details?, correlationId, timestamp } }
 * Never leaks stack traces or internal messages for unexpected (5xx) errors.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { correlationId?: string }>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let code = "internal_error";
    let message = "Something went wrong. Please try again.";
    let details: unknown;

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
      } else if (typeof body === "object" && body !== null) {
        const b = body as Record<string, unknown>;
        message = (b.message as string) ?? exception.message;
        details = b.errors ?? undefined;
      }
      code = HttpStatus[status]?.toString().toLowerCase() ?? "http_error";
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      error: {
        code,
        message,
        details,
        correlationId: request.correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
