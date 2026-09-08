import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { randomUUID, createHash } from "crypto";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { EmailService } from "../notifications/email.service";
import { RegisterDto, LoginDto, ResetPasswordDto } from "./dto/auth.dto";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly notifications: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto, meta: { userAgent?: string; ipAddress?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("An account with this email already exists");

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        fullName: dto.fullName,
        passwordHash,
        role: UserRole.CUSTOMER,
        customerProfile: { create: {} },
      },
    });

    await this.notifications.notify({
      userId: user.id,
      type: "account_verification",
      title: "Verify your email",
      body: `Welcome to ${dto.fullName}! Please verify your email to finish setting up your account. (Dev note: email verification link generation is part of Phase 2 self-serve auth.)`,
      email: user.email,
      dedupeKey: "account_verification",
    });

    return this.issueTokens(user.id, user.role, user.email, meta);
  }

  async login(dto: LoginDto, meta: { userAgent?: string; ipAddress?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException("Invalid email or password");

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException("Invalid email or password");

    if (user.status === "SUSPENDED") throw new UnauthorizedException("This account has been suspended");

    return this.issueTokens(user.id, user.role, user.email, meta);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException("Invalid or expired session");
    }

    const tokenHash = hashToken(refreshToken);
    const session = await this.prisma.userSession.findFirst({
      where: { userId: payload.sub, refreshTokenHash: tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!session) throw new UnauthorizedException("Session no longer valid");

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    // Rotate: revoke the used refresh token, issue a new pair.
    await this.prisma.userSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(user.id, user.role, user.email, {
      userAgent: session.userAgent ?? undefined,
      ipAddress: session.ipAddress ?? undefined,
    });
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.userSession.updateMany({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always respond as if successful, to avoid leaking which emails have accounts.
    if (!user) return;

    const token = this.jwtService.sign({ sub: user.id, purpose: "password_reset" }, { expiresIn: "1h", secret: process.env.JWT_ACCESS_SECRET });
    await this.emailService.send({
      to: user.email,
      subject: "Reset your password",
      text: `Use this link to reset your password (valid 1 hour): ${process.env.WEB_BASE_URL}/reset-password?token=${token}`,
    });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwtService.verify(dto.token, { secret: process.env.JWT_ACCESS_SECRET });
    } catch {
      throw new UnauthorizedException("Invalid or expired reset link");
    }
    if (payload.purpose !== "password_reset") throw new UnauthorizedException("Invalid reset token");

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({ where: { id: payload.sub }, data: { passwordHash } });
    await this.logoutAll(payload.sub);
  }

  private async issueTokens(
    userId: string,
    role: UserRole,
    email: string,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<TokenPair> {
    const accessToken = this.jwtService.sign(
      { sub: userId, role, email },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_TTL ?? "15m" },
    );
    const jti = randomUUID();
    const refreshToken = this.jwtService.sign(
      { sub: userId, jti },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: process.env.JWT_REFRESH_TTL ?? "30d" },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash: hashToken(refreshToken),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
