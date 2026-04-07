import { describe, it, expect, beforeEach } from "vitest";
import { setTokenCookie, removeTokenCookie } from "@/lib/cookies";

describe("cookies", () => {
  beforeEach(() => {
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      document.cookie = `${name}=; max-age=0; path=/`;
    });
  });

  it("setTokenCookie sets access_token cookie", () => {
    setTokenCookie("mytoken123");
    expect(document.cookie).toContain("access_token=mytoken123");
  });

  it("removeTokenCookie clears access_token cookie", () => {
    setTokenCookie("mytoken123");
    removeTokenCookie();
    expect(document.cookie).not.toContain("access_token=mytoken123");
  });
});
