import path from "path";

/** Disco que sobrevive ao deploy. Sem volume, cai em public/uploads. */
export function persistentUploadRoot(): string {
  const mount = (process.env.RAILWAY_VOLUME_MOUNT_PATH ?? "").replace(/\\/g, "/").replace(/\/$/, "");
  if (mount) return path.join(mount, "uploads");
  return path.join(process.cwd(), "public", "uploads");
}

export function publicUploadRoot(): string {
  return path.join(process.cwd(), "public", "uploads");
}
