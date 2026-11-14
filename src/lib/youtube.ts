const VIDEO_ID = /^[\w-]{11}$/;

/** Extrai o ID de 11 caracteres de URLs comuns do YouTube ou do próprio ID. */
export function parseYoutubeVideoId(input: string): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  if (VIDEO_ID.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0]?.split("?")[0] ?? "";
    return VIDEO_ID.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v") ?? "";
      return VIDEO_ID.test(id) ? id : null;
    }
    const embed = url.pathname.match(/^\/embed\/([\w-]{11})/);
    if (embed) return embed[1]!;
    const shorts = url.pathname.match(/^\/shorts\/([\w-]{11})/);
    if (shorts) return shorts[1]!;
    const live = url.pathname.match(/^\/live\/([\w-]{11})/);
    if (live) return live[1]!;
  }

  return null;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}