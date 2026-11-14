import { redirect } from "next/navigation";

/** URL antiga — manutenção agora aparece na própria rota visitada (ex.: `/`). */
export default function ManutencaoLegacyPage() {
  redirect("/");
}