import { consumeAdminFlash } from "@/lib/admin-flash";

export async function AdminFlashBanner() {
  const message = await consumeAdminFlash();
  if (!message) return null;

  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-sm"
    >
      {message}
    </div>
  );
}
