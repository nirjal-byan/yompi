import { describe, expect, it } from "vitest";
import { detectImageType } from "./image-type.js";

describe("detectImageType", () => {
  it("recognises jpeg, png and webp by their first bytes", () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))?.extension).toBe("jpg");
    expect(
      detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.extension,
    ).toBe("png");
    expect(detectImageType(Buffer.from("RIFF0000WEBPVP8 "))?.extension).toBe("webp");
  });

  it("rejects other content even if it is named like an image", () => {
    expect(detectImageType(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
  });
});
