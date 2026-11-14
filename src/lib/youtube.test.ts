import { describe, expect, it } from "vitest";
import { parseYoutubeVideoId, youtubeEmbedUrl } from "./youtube";

describe("parseYoutubeVideoId", () => {
  it("aceita ID puro", () => {
    expect(parseYoutubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("aceita watch", () => {
    expect(parseYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("aceita youtu.be", () => {
    expect(parseYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("aceita shorts", () => {
    expect(parseYoutubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rejeita lixo", () => {
    expect(parseYoutubeVideoId("https://example.com")).toBeNull();
  });
});

describe("youtubeEmbedUrl", () => {
  it("usa nocookie", () => {
    expect(youtubeEmbedUrl("dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });
});