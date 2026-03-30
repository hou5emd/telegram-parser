import { describe, expect, it } from "bun:test";

import { parseDateValue } from "./date";

describe("parseDateValue", () => {
  it("parses unix timestamps in seconds", () => {
    expect(parseDateValue(1_742_847_600)?.toISOString()).toBe("2025-03-24T20:20:00.000Z");
  });

  it("parses unix timestamps in milliseconds", () => {
    expect(parseDateValue(1_742_847_600_000)?.toISOString()).toBe("2025-03-24T20:20:00.000Z");
  });

  it("parses numeric timestamps provided as strings", () => {
    expect(parseDateValue("1742847600")?.toISOString()).toBe("2025-03-24T20:20:00.000Z");
  });

  it("parses iso strings", () => {
    expect(parseDateValue("2025-03-25T10:20:00.000Z")?.toISOString()).toBe("2025-03-25T10:20:00.000Z");
  });

  it("returns null for invalid values", () => {
    expect(parseDateValue("not-a-date")).toBeNull();
  });
});
