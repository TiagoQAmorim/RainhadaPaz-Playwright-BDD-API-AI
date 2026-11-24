"use client";

import { useSearchParams } from "next/navigation";
import { adminFlashMessage, isAdminFlashKind } from "@/lib/admin-flash";

export function AdminFlashBanner() {
  const params = useSearchParams();
  const flash = params.get("flash");
  if (!isAdminFlashKind(flash)) return null;
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
