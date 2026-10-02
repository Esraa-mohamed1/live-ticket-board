import { SlidingWindowLimiter } from "./sliding-window";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "@/config/constants";

export const rateLimiter = new SlidingWindowLimiter(
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS
);

export type { RateLimitResult } from "./sliding-window";
