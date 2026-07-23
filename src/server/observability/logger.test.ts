import { afterEach, describe, expect, it, vi } from "vitest";
import { logEvent } from "./logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logEvent", () => {
  it("emits structured context without serializing error messages", () => {
    const write = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logEvent(
      "error",
      "draft_generation_failed",
      { requestId: "req-123", organizationId: "org-1" },
      new Error("customer content must not appear")
    );

    const entry = JSON.parse(String(write.mock.calls[0][0]));
    expect(entry).toMatchObject({
      level: "error",
      event: "draft_generation_failed",
      requestId: "req-123",
      organizationId: "org-1",
      errorType: "Error"
    });
    expect(write.mock.calls[0][0]).not.toContain("customer content");
  });
});
