/** Subscription plan tiers and limit checks for Access → Locations / Tablets. */
import type { ConsoleState } from "./console-data";

export type PlanId = "starter" | "pro" | "enterprise";
export type PlanResource = "locations" | "registers" | "employees";

export type BillingPlan = {
  id: PlanId;
  name: string;
  /** Monthly price in Philippine pesos. */
  price: number;
  limits: Record<PlanResource, number>;
  description: string;
};

/** `Infinity` renders as “Unlimited” in the console. */
export const BILLING_PLANS: Record<PlanId, BillingPlan> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 1490,
    limits: { locations: 1, registers: 1, employees: 5 },
    description: "One counter or café getting started with Poster.",
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 3795,
    limits: { locations: 3, registers: 5, employees: 25 },
    description: "Multi-shift restaurants with several registers.",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 7990,
    limits: { locations: Number.POSITIVE_INFINITY, registers: Number.POSITIVE_INFINITY, employees: Number.POSITIVE_INFINITY },
    description: "Unlimited locations, registers and employees.",
  },
};

/** The trial default and the plan the demo tenant ships on. */
export const DEFAULT_PLAN: PlanId = "pro";

export function getPlan(id: PlanId | string | null | undefined): BillingPlan {
  return BILLING_PLANS[(id as PlanId) in BILLING_PLANS ? (id as PlanId) : DEFAULT_PLAN];
}

export function planLimit(id: PlanId | string | null | undefined, resource: PlanResource): number {
  return getPlan(id).limits[resource];
}

export function planLimitLabel(value: number): string {
  return Number.isFinite(value) ? String(value) : "Unlimited";
}

/** True when adding one more resource stays within the tier cap. */
export function withinPlanLimit(id: PlanId | string | null | undefined, resource: PlanResource, currentCount: number): boolean {
  return currentCount + 1 <= planLimit(id, resource);
}

export function planUsage(state: ConsoleState, resource: PlanResource): number {
  if (resource === "locations") return state.locations.length;
  if (resource === "registers") return state.registers.length;
  return state.employees.length;
}

export function planForState(state: ConsoleState): PlanId {
  return state.plan ?? DEFAULT_PLAN;
}
