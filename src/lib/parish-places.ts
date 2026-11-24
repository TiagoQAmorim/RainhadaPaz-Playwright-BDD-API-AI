/** Endereços fixos da Matriz e da Capela, para o mapa da página institucional. */
export const INSTITUTIONAL_PLACES = [
  {
    key: "matriz",
    title: "Mapa da Matriz",
    address: "R. Sócrates, 813 — Vila Sofia, São Paulo — SP, CEP 04671-072",
    query: "R. Sócrates, 813, Vila Sofia, São Paulo, SP, 04671-072",
  },
  {
    key: "capela",
    title: "Mapa da Capela do Colégio Santa Maria",
    address: "Av. Sargento Geraldo Sant'Ana, 901 – Jardim Marajoara, São Paulo – SP, CEP 04674-225",
    query: "Av. Sargento Geraldo Sant'Ana, 901, Jardim Marajoara, São Paulo, SP, 04674-225",
  },
] as const;

export type InstitutionalPlaceKey = (typeof INSTITUTIONAL_PLACES)[number]["key"];

export function parishPlaceMapSrc(query: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=pt-BR&z=16&output=embed`;
}
