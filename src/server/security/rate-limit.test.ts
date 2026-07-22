import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimitsForTests } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(resetRateLimitsForTests);

  it("limits repeated generation attempts within a window", () => {
    for (let index = 0; index < 12; index += 1) {
      expect(checkRateLimit("actor", 1_000).allowed).toBe(true);
    }
    expect(checkRateLimit("actor", 1_000).allowed).toBe(false);
    expect(checkRateLimit("actor", 61_001).allowed).toBe(true);
  });
});
