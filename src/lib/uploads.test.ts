import { describe, expect, it } from "vitest";
import { imageMimeFromBytes } from "./image-mime";

describe("imageMimeFromBytes", () => {
  it("reconhece jpeg, png, gif e webp pelos bytes", () => {
    expect(imageMimeFromBytes(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]))).toBe("image/jpeg");
    expect(imageMimeFromBytes(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      "image/png",
    );
    expect(imageMimeFromBytes(Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe("image/gif");
    const webp = new Uint8Array(12);
    webp.set([0x52, 0x49, 0x46, 0x46], 0);
    webp.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(imageMimeFromBytes(webp)).toBe("image/webp");
  });

  it("ignora arquivo que não é imagem", () => {
    expect(imageMimeFromBytes(Uint8Array.from([0x3c, 0x68, 0x74, 0x6d, 0x6c]))).toBeNull();
  });
});
