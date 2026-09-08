import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { RolesGuard } from "./roles.guard";

function makeContext(user: any, handlerRoles: UserRole[] | undefined) {
  const reflector = { getAllAndOverride: () => handlerRoles } as unknown as Reflector;
  const guard = new RolesGuard(reflector);
  const context = {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
  return { guard, context };
}

describe("RolesGuard", () => {
  it("allows access when no roles are required", () => {
    const { guard, context } = makeContext({ role: UserRole.CUSTOMER }, undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows access when the user's role is in the required list", () => {
    const { guard, context } = makeContext({ role: UserRole.ADMIN }, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejects a customer trying to hit an admin-only route", () => {
    const { guard, context } = makeContext({ role: UserRole.CUSTOMER }, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("rejects an unauthenticated request against a role-restricted route", () => {
    const { guard, context } = makeContext(undefined, [UserRole.ADMIN]);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
