import { adminFlashMessage, isAdminFlashKind } from "@/lib/admin-flash";

export function AdminFlashBanner({ kind }: { kind: string | null }) {
  if (!isAdminFlashKind(kind)) return null;
  const flash = kind;
  const failed = flash === "image";

  return (
    <div
      role="status"
      className={
        failed
          ? "mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900 shadow-sm"
          : "mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-sm"
      }
    >
      {adminFlashMessage(flash)}
    </div>
  );
}
