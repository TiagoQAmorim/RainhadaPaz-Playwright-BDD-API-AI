/** Shared state between steps (generated titles in tests). */
export const e2eWorld = {
  lastNoticeTitle: "",
  lastPostTitle: "",
  lastMassLocationName: "",
};

export function uniqueLabel(prefix: string): string {
  return `${prefix} E2E ${Date.now()}`;
}
