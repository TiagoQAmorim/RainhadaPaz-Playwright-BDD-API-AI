import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import QRCode from "qrcode";
import { buildParishPixCopiaECola } from "@/lib/parish-pix";
import { formatTicketNumber, raffleBookletNumber, ticketPriceLabel } from "@/lib/raffle-rules";

export type RaffleTicketPdfInput = {
  parishName: string;
  prizeTitle: string;
  ticketPriceCents: number;
  buyerName: string;
  buyerPhone: string;
  tickets: { ticketNumber: number }[];
};

const NAVY = rgb(0.12, 0.28, 0.48);
const GOLD = rgb(0.62, 0.48, 0.16);
const INK = rgb(0.15, 0.16, 0.18);
const MUTED = rgb(0.35, 0.38, 0.42);
const LINE = rgb(0.75, 0.78, 0.82);

function dashH(page: PDFPage, x1: number, x2: number, y: number) {
  for (let x = x1; x < x2; x += 7) {
    page.drawLine({ start: { x, y }, end: { x: Math.min(x + 4, x2), y }, thickness: 0.6, color: LINE });
  }
}

function dashV(page: PDFPage, x: number, y1: number, y2: number) {
  for (let y = y1; y < y2; y += 7) {
    page.drawLine({ start: { x, y }, end: { x, y: Math.min(y + 4, y2) }, thickness: 0.6, color: LINE });
  }
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) current = next;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

export async function buildRaffleTicketsPdf(input: RaffleTicketPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const price = ticketPriceLabel(input.ticketPriceCents);

  for (const ticket of input.tickets) {
    const page = pdf.addPage([740, 300]);
    const label = formatTicketNumber(ticket.ticketNumber);
    const booklet = raffleBookletNumber(ticket.ticketNumber);
    dashH(page, 18, 722, 284);
    dashH(page, 18, 722, 16);
    dashV(page, 18, 16, 284);
    dashV(page, 722, 16, 284);
    dashV(page, 248, 16, 284);

    page.drawText("CANHOTO", { x: 32, y: 258, size: 9, font: bold, color: NAVY });
    page.drawText(`Talão ${booklet}`, { x: 32, y: 236, size: 11, font, color: MUTED });
    page.drawText(label, { x: 32, y: 188, size: 36, font: bold, color: INK });
    page.drawText("Nome", { x: 32, y: 158, size: 9, font, color: MUTED });
    page.drawText(input.buyerName.slice(0, 28), { x: 68, y: 158, size: 11, font: bold, color: INK });
    page.drawLine({ start: { x: 64, y: 154 }, end: { x: 228, y: 154 }, thickness: 0.4, color: LINE });
    page.drawText("Tel.", { x: 32, y: 136, size: 9, font, color: MUTED });
    page.drawText(input.buyerPhone.slice(0, 22), { x: 58, y: 136, size: 11, font: bold, color: INK });
    page.drawLine({ start: { x: 54, y: 132 }, end: { x: 228, y: 132 }, thickness: 0.4, color: LINE });

    const br = buildParishPixCopiaECola({
      amountCents: input.ticketPriceCents,
      transactionId: `RIFA${label}`,
    });
    if (br) {
      const png = await QRCode.toBuffer(br, { type: "png", margin: 0, width: 200 });
      const image = await pdf.embedPng(png);
      page.drawImage(image, { x: 78, y: 42, width: 72, height: 72 });
    }
    page.drawText(`PIX · ${price}`, { x: 62, y: 26, size: 9, font: bold, color: INK });

    page.drawRectangle({ x: 248, y: 252, width: 474, height: 32, color: NAVY });
    page.drawText("RIFA BENEFICENTE", { x: 264, y: 264, size: 11, font: bold, color: rgb(1, 1, 1) });
    page.drawText(input.parishName, { x: 264, y: 226, size: 13, font: bold, color: INK });
    page.drawText("PRÊMIO", { x: 264, y: 204, size: 8, font: bold, color: MUTED });
    const prizeLines = wrapText(input.prizeTitle, bold, 14, 280);
    prizeLines.forEach((line, i) => {
      page.drawText(line, { x: 264, y: 184 - i * 16, size: 14, font: bold, color: INK });
    });
    const numberWidth = bold.widthOfTextAtSize(label, 32);
    page.drawText(label, { x: 700 - numberWidth, y: 168, size: 32, font: bold, color: GOLD });
    page.drawText(price, { x: 264, y: 92, size: 18, font: bold, color: INK });
    page.drawText("por número", { x: 600, y: 96, size: 11, font, color: MUTED });
    page.drawText("Guarde este bilhete. Ele é seu comprovante.", {
      x: 264,
      y: 36,
      size: 9,
      font,
      color: MUTED,
    });
  }

  return pdf.save();
}
