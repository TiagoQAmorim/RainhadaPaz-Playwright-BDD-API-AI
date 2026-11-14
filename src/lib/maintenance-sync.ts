import { cookies } from "next/headers";
import { MAINTENANCE_COOKIE } from "@/lib/maintenance-cookie";

export async function syncMaintenanceCookie(active: boolean) {
  const store = await cookies();
  if (active) {
    store.set(MAINTENANCE_COOKIE, "1", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  } else {
    store.delete(MAINTENANCE_COOKIE);
  }
}