import { redirect } from "next/navigation";

/** Calendário/eventos removidos do site — redireciona ao painel. */
export default function AdminEventosRedirect() {
  redirect("/admin");
}
