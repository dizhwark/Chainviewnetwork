import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  email: string;
}

/**
 * Verifies a short-lived access token from either the `Authorization: Bearer`
 * header or the `access_token` httpOnly cookie, and attaches the decoded
 * user to the request. Object-level ownership is enforced per-route in the
 * service layer (e.g. a support-case query scoped to req.user.userId),
 * never inferred from a client-supplied ID alone.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException("Authentication required");
    }
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_ACCESS_SECRET });
      request.user = { userId: payload.sub, role: payload.role, email: payload.email } as AuthenticatedUser;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired session");
    }
  }

  private extractToken(request: any): string | undefined {
    const header = request.headers.authorization;
    if (header?.startsWith("Bearer ")) return header.slice(7);
    return request.cookies?.access_token;
  }
}
