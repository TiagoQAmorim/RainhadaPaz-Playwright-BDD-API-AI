import { formatTicketNumber } from "@/lib/raffle-rules";
import { prisma } from "@/lib/prisma";

function csvCell(value: string | number | null | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(";");
}

export type RaffleReportPart = "completo" | "compras" | "cotas" | "disponiveis";

export async function buildRaffleReportCsv(
  raffleId: string,
  part: RaffleReportPart = "completo",
): Promise<{ filename: string; body: string }> {
  const raffle = await prisma.raffle.findUnique({
    where: { id: raffleId },
    select: { title: true, slug: true },
  });
  const slug = raffle?.slug ?? raffleId;
  const lines: string[] = [];

  const pushSection = (title: string, header: string[], rows: string[]) => {
    lines.push(csvRow([title]));
    lines.push(header.join(";"));
    lines.push(...rows);
    lines.push("");
  };

  if (part === "completo" || part === "compras") {
    const orders = await prisma.raffleOrder.findMany({
      where: { raffleId },
      include: {
        lines: {
          include: {
            ticket: { include: { saint: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const orderRows = orders.map((o) => {
      const cotas = o.lines
        .map(
          (l) =>
            `#${formatTicketNumber(l.ticket.ticketNumber)}${l.ticket.saint ? ` (${l.ticket.saint.name})` : ""}`,
        )
        .join(", ");
      return csvRow([
        o.id,
        o.createdAt.toISOString(),
        o.status,
        o.buyerName,
        o.buyerEmail,
        o.buyerPhone,
        o.buyerCpf ?? "",
        (o.totalCents / 100).toFixed(2),
        o.lines.length,
        cotas,
      ]);
    });

    pushSection(`Pedidos — ${raffle?.title ?? slug}`, [
      "pedido_id",
      "criado_em",
      "status_pedido",
      "comprador",
      "email",
      "telefone",
      "cpf",
      "total_reais",
      "qtd_cotas",
      "cotas_santos",
    ], orderRows);
  }

  if (part === "completo" || part === "cotas") {
    const soldTickets = await prisma.raffleTicket.findMany({
      where: { raffleId, status: "SOLD" },
      include: {
        saint: true,
        orderLine: { include: { order: true } },
      },
      orderBy: { ticketNumber: "asc" },
    });

    const soldRows = soldTickets.map((t) => {
      const o = t.orderLine?.order;
      return csvRow([
        formatTicketNumber(t.ticketNumber),
        t.status,
        t.saint?.name ?? "",
        t.saint?.celebration ?? "",
        o?.buyerName ?? "",
        o?.buyerEmail ?? "",
        o?.buyerPhone ?? "",
        o?.buyerCpf ?? "",
        o?.status ?? "",
        o?.id ?? "",
        t.soldAt?.toISOString() ?? "",
      ]);
    });

    pushSection(`Cotas vendidas — ${raffle?.title ?? slug}`, [
      "numero",
      "status_cota",
      "santo",
      "celebracao",
      "comprador",
      "email",
      "telefone",
      "cpf",
      "status_pedido",
      "pedido_id",
      "vendida_em",
    ], soldRows);
  }

  if (part === "completo" || part === "disponiveis") {
    const available = await prisma.raffleTicket.findMany({
      where: { raffleId, status: "AVAILABLE" },
      include: { saint: true },
      orderBy: { ticketNumber: "asc" },
    });

    const availRows = available.map((t) =>
      csvRow([
        formatTicketNumber(t.ticketNumber),
        t.saint?.name ?? "",
        t.saint?.celebration ?? "",
      ]),
    );

    pushSection(`Cotas não compradas (disponíveis) — ${raffle?.title ?? slug}`, [
      "numero",
      "santo",
      "celebracao",
    ], availRows);
  }

  if (part === "cotas") {
    const allTickets = await prisma.raffleTicket.findMany({
      where: { raffleId },
      include: {
        saint: true,
        orderLine: { include: { order: true } },
      },
      orderBy: { ticketNumber: "asc" },
    });

    const allRows = allTickets.map((t) => {
      const o = t.orderLine?.order;
      return csvRow([
        formatTicketNumber(t.ticketNumber),
        t.status,
        t.saint?.name ?? "",
        t.saint?.celebration ?? "",
        o?.buyerName ?? "",
        o?.buyerEmail ?? "",
        o?.buyerPhone ?? "",
        o?.id ?? "",
      ]);
    });

    pushSection(`Todas as cotas — ${raffle?.title ?? slug}`, [
      "numero",
      "status",
      "santo",
      "celebracao",
      "comprador",
      "email",
      "telefone",
      "pedido",
    ], allRows);
  }

  const body = `\uFEFF${lines.join("\n")}`;
  const suffix =
    part === "completo"
      ? "relatorio-completo"
      : part === "compras"
        ? "compras"
        : part === "disponiveis"
          ? "nao-compradas"
          : "cotas";
  return { filename: `rifa-${slug}-${suffix}.csv`, body };
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ";") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Mesmo conteúdo do CSV, em XML. */
export async function buildRaffleReportXml(
  raffleId: string,
  part: RaffleReportPart = "completo",
): Promise<{ filename: string; body: string }> {
  const csv = await buildRaffleReportCsv(raffleId, part);
  const lines = csv.body.replace(/^\uFEFF/, "").split("\n");
  const sections: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const titleLine = lines[i]?.trim();
    if (!titleLine) {
      i++;
      continue;
    }
    const title = parseCsvLine(titleLine)[0] ?? "secao";
    const headers = parseCsvLine(lines[i + 1] ?? "");
    i += 2;
    const rows: string[] = [];
    while (i < lines.length && lines[i]?.trim()) {
      const cells = parseCsvLine(lines[i] ?? "");
      const fields = headers
        .map((header, idx) => {
          const tag = (header || `campo${idx + 1}`).replace(/[^a-zA-Z0-9_]/g, "_");
          return `<${tag}>${xmlEscape(cells[idx] ?? "")}</${tag}>`;
        })
        .join("");
      rows.push(`<linha>${fields}</linha>`);
      i++;
    }
    sections.push(`<secao nome="${xmlEscape(title)}">${rows.join("")}</secao>`);
  }
  return {
    filename: csv.filename.replace(/\.csv$/i, ".xml"),
    body: `<?xml version="1.0" encoding="UTF-8"?>\n<relatorio>${sections.join("")}</relatorio>\n`,
  };
}