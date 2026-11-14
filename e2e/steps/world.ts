/** Shared state between steps (generated titles in tests). */
export type E2eCleanupQueue = {
  notices: string[];
  posts: string[];
  massLocations: string[];
  candleDonorNames: string[];
};

export const e2eWorld = {
  lastNoticeTitle: "",
  lastPostTitle: "",
  lastMassLocationName: "",
  cleanup: {
    notices: [],
    posts: [],
    massLocations: [],
    candleDonorNames: [],
  } as E2eCleanupQueue,
};

export function uniqueLabel(prefix: string): string {
  return `${prefix} E2E ${Date.now()}`;
}

export function trackNoticeForCleanup(title: string): void {
  e2eWorld.lastNoticeTitle = title;
  e2eWorld.cleanup.notices.push(title);
}

export function trackPostForCleanup(title: string): void {
  e2eWorld.lastPostTitle = title;
  e2eWorld.cleanup.posts.push(title);
}

export function trackMassLocationForCleanup(name: string): void {
  e2eWorld.lastMassLocationName = name;
  e2eWorld.cleanup.massLocations.push(name);
}

export function trackCandleDonorForCleanup(donorName: string): void {
  e2eWorld.cleanup.candleDonorNames.push(donorName);
}

export function resetE2eWorld(): void {
  e2eWorld.lastNoticeTitle = "";
  e2eWorld.lastPostTitle = "";
  e2eWorld.lastMassLocationName = "";
  e2eWorld.cleanup.notices = [];
  e2eWorld.cleanup.posts = [];
  e2eWorld.cleanup.massLocations = [];
  e2eWorld.cleanup.candleDonorNames = [];
}
