export const PLAN_LIMITS = {
  free: {
    boards: 2,
    membersPerBoard: 3,
  },
  pro: {
    boards: Infinity,
    membersPerBoard: Infinity,
  },
} as const

export type Plan = keyof typeof PLAN_LIMITS

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as Plan] ?? PLAN_LIMITS.free
}
