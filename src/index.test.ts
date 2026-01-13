import { describe, expect, it } from "bun:test";

describe("worktree-code-review", () => {
  it("should pass a dummy test", () => {
    expect(true).toBe(true);
  });

  it("should perform basic arithmetic", () => {
    expect(1 + 1).toBe(2);
  });
});
