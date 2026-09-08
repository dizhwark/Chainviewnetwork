/**
 * Booking state machine — single source of truth. Mirrors
 * docs/booking-state-machine.md exactly. The API is the only writer of
 * booking status; this module is imported by the API to validate every
 * transition and by the web app only for optimistic-UI / display logic.
 */

export const BOOKING_STATUSES = [
  "DRAFT",
  "REQUESTED",
  "SEARCHING",
  "OFFERED",
  "ACCEPTED",
  "EN_ROUTE",
  "ARRIVED",
  "INSPECTION_IN_PROGRESS",
  "ESTIMATE_PENDING",
  "ESTIMATE_APPROVED",
  "ESTIMATE_REJECTED",
  "WORK_IN_PROGRESS",
  "WORK_PAUSED",
  "WORK_COMPLETED",
  "COMPLETION_CONFIRMATION_PENDING",
  "PAYMENT_PROCESSING",
  "PAID",
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_BY_PLUMBER",
  "CANCELLED_BY_ADMIN",
  "DISPUTED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "CLOSED",
  "NO_PLUMBER_AVAILABLE",
  "NO_SHOW",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type Actor = "customer" | "plumber" | "admin" | "system";

interface TransitionRule {
  to: BookingStatus;
  actors: Actor[];
}

const CANCELLABLE_ACTIVE_STATES: BookingStatus[] = [
  "REQUESTED",
  "SEARCHING",
  "OFFERED",
  "ACCEPTED",
  "EN_ROUTE",
  "ARRIVED",
  "INSPECTION_IN_PROGRESS",
  "ESTIMATE_PENDING",
  "ESTIMATE_APPROVED",
  "WORK_IN_PROGRESS",
  "WORK_PAUSED",
];

const BASE_TRANSITIONS: Record<BookingStatus, TransitionRule[]> = {
  DRAFT: [{ to: "REQUESTED", actors: ["customer"] }],
  REQUESTED: [{ to: "SEARCHING", actors: ["system", "admin"] }],
  SEARCHING: [
    { to: "OFFERED", actors: ["system"] },
    { to: "NO_PLUMBER_AVAILABLE", actors: ["system"] },
  ],
  OFFERED: [
    { to: "ACCEPTED", actors: ["plumber", "admin"] },
    { to: "SEARCHING", actors: ["system"] },
  ],
  ACCEPTED: [
    { to: "EN_ROUTE", actors: ["plumber"] },
    { to: "CANCELLED_BY_PLUMBER", actors: ["plumber"] },
    { to: "CANCELLED_BY_CUSTOMER", actors: ["customer"] },
  ],
  EN_ROUTE: [
    { to: "ARRIVED", actors: ["plumber"] },
    { to: "NO_SHOW", actors: ["admin", "system"] },
    { to: "CANCELLED_BY_PLUMBER", actors: ["plumber"] },
    { to: "CANCELLED_BY_CUSTOMER", actors: ["customer"] },
  ],
  ARRIVED: [{ to: "INSPECTION_IN_PROGRESS", actors: ["plumber"] }],
  INSPECTION_IN_PROGRESS: [{ to: "ESTIMATE_PENDING", actors: ["plumber"] }],
  ESTIMATE_PENDING: [
    { to: "ESTIMATE_APPROVED", actors: ["customer"] },
    { to: "ESTIMATE_REJECTED", actors: ["customer"] },
  ],
  ESTIMATE_APPROVED: [{ to: "WORK_IN_PROGRESS", actors: ["plumber"] }],
  ESTIMATE_REJECTED: [{ to: "CLOSED", actors: ["system", "admin"] }],
  WORK_IN_PROGRESS: [
    { to: "WORK_PAUSED", actors: ["plumber"] },
    { to: "WORK_COMPLETED", actors: ["plumber"] },
  ],
  WORK_PAUSED: [{ to: "WORK_IN_PROGRESS", actors: ["plumber"] }],
  WORK_COMPLETED: [{ to: "COMPLETION_CONFIRMATION_PENDING", actors: ["system"] }],
  COMPLETION_CONFIRMATION_PENDING: [{ to: "PAYMENT_PROCESSING", actors: ["customer", "system"] }],
  PAYMENT_PROCESSING: [
    { to: "PAID", actors: ["system"] },
    { to: "DISPUTED", actors: ["system"] },
  ],
  PAID: [
    { to: "DISPUTED", actors: ["customer", "admin"] },
    { to: "CLOSED", actors: ["system"] },
  ],
  DISPUTED: [
    { to: "PARTIALLY_REFUNDED", actors: ["admin"] },
    { to: "REFUNDED", actors: ["admin"] },
    { to: "CLOSED", actors: ["admin"] },
  ],
  PARTIALLY_REFUNDED: [{ to: "CLOSED", actors: ["system"] }],
  REFUNDED: [{ to: "CLOSED", actors: ["system"] }],
  CLOSED: [],
  NO_PLUMBER_AVAILABLE: [{ to: "SEARCHING", actors: ["admin", "system"] }],
  NO_SHOW: [{ to: "SEARCHING", actors: ["admin", "system"] }],
  CANCELLED_BY_CUSTOMER: [],
  CANCELLED_BY_PLUMBER: [],
  CANCELLED_BY_ADMIN: [],
};

// Any active state can be force-cancelled by an administrator.
for (const state of CANCELLABLE_ACTIVE_STATES) {
  BASE_TRANSITIONS[state].push({ to: "CANCELLED_BY_ADMIN", actors: ["admin"] });
}

export const BOOKING_TRANSITIONS: Readonly<Record<BookingStatus, readonly TransitionRule[]>> = BASE_TRANSITIONS;

export function canTransition(from: BookingStatus, to: BookingStatus, actor: Actor): boolean {
  const rules = BOOKING_TRANSITIONS[from] ?? [];
  return rules.some((rule) => rule.to === to && rule.actors.includes(actor));
}

export function assertTransition(from: BookingStatus, to: BookingStatus, actor: Actor): void {
  if (!canTransition(from, to, actor)) {
    throw new BookingTransitionError(from, to, actor);
  }
}

export class BookingTransitionError extends Error {
  constructor(
    public readonly from: BookingStatus,
    public readonly to: BookingStatus,
    public readonly actor: Actor,
  ) {
    super(`Invalid booking transition: ${actor} cannot move booking from ${from} to ${to}`);
    this.name = "BookingTransitionError";
  }
}

export const TERMINAL_STATUSES: BookingStatus[] = [
  "CLOSED",
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_BY_PLUMBER",
  "CANCELLED_BY_ADMIN",
];

export function isTerminal(status: BookingStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
