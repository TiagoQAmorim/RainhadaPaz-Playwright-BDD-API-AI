export type PublicCandle = {
  id: string;
  donorName: string;
  intention: string;
  prayer: string | null;
  intentionPublic: boolean;
  prayerPublic: boolean;
  litAt: string;
  expiresAt: string | null;
  paid: boolean;
  prayerTogetherCount: number;
};
