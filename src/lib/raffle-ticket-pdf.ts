import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { RAFFLE_SICREDI_PAYMENT } from "@/lib/parish-payments";
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

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 28;
const TICKET_H = 148;
const TICKET_GAP = 16;
const CANHOTO_W = 118;
const PER_PAGE = 4;

const NAVY = rgb(0.12, 0.28, 0.48);
const GOLD = rgb(0.62, 0.48, 0.16);
const INK = rgb(0.15, 0.16, 0.18);
const MUTED = rgb(0.35, 0.38, 0.42);
const DOT = rgb(0.22, 0.3, 0.42);
const WHITE = rgb(1, 1, 1);

function dottedLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  if (length < 1) return;
  const dx = (x2 - x1) / length;
  const dy = (y2 - y1) / length;
  const dash = 2.4;
  const gap = 2.2;
  for (let traveled = 0; traveled < length; traveled += dash + gap) {
    const end = Math.min(traveled + dash, length);
    page.drawLine({
      start: { x: x1 + dx * traveled, y: y1 + dy * traveled },
      end: { x: x1 + dx * end, y: y1 + dy * end },
      thickness: 1,
      color: DOT,
    });
  }
}

function fitText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (font.widthOfTextAtSize(clean, size) <= maxWidth) return clean;
  let cut = clean;
  while (cut.length > 1 && font.widthOfTextAtSize(`${cut}…`, size) > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut}…`;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number, maxLines: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) current = next;
    else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(fitText(current, font, size, maxWidth));
  return lines;
}

export async function buildRaffleTicketsPdf(input: RaffleTicketPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const price = ticketPriceLabel(input.ticketPriceCents);
  const ticketWidth = PAGE_W - MARGIN * 2;

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let slot = 0;

  for (const ticket of input.tickets) {
    if (slot === PER_PAGE) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      slot = 0;
    }
    const bottom = PAGE_H - MARGIN - (slot + 1) * TICKET_H - slot * TICKET_GAP;
    await drawTicket(page, pdf, {
      x: MARGIN,
      y: bottom,
      w: ticketWidth,
      h: TICKET_H,
      font,
      bold,
      price,
      input,
      ticketNumber: ticket.ticketNumber,
    });
    slot += 1;
  }

  return pdf.save();
}

async function drawTicket(
  page: PDFPage,
  pdf: PDFDocument,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    font: PDFFont;
    bold: PDFFont;
    price: string;
    input: RaffleTicketPdfInput;
    ticketNumber: number;
  },
) {
  const { x, y, w, h, font, bold, price, input, ticketNumber } = opts;
  const split = x + CANHOTO_W;
  const label = formatTicketNumber(ticketNumber);
  const booklet = raffleBookletNumber(ticketNumber);
  const top = y + h;

  dottedLine(page, x, y, x + w, y);
  dottedLine(page, x, top, x + w, top);
  dottedLine(page, x, y, x, top);
  dottedLine(page, x + w, y, x + w, top);
  dottedLine(page, split, y + 6, split, top - 6);

  page.drawText("CANHOTO", { x: x + 8, y: top - 16, size: 7, font: bold, color: NAVY });
  page.drawText(`Talão ${booklet}`, { x: x + 8, y: top - 28, size: 8, font, color: MUTED });
  page.drawText(label, { x: x + 8, y: top - 50, size: 18, font: bold, color: INK });

  page.drawText("Nome", { x: x + 8, y: top - 66, size: 7, font, color: MUTED });
  page.drawText(fitText(input.buyerName, bold, 8, CANHOTO_W - 42), {
    x: x + 32,
    y: top - 66,
    size: 8,
    font: bold,
    color: INK,
  });
  dottedLine(page, x + 30, top - 69, split - 8, top - 69);

  page.drawText("Tel.", { x: x + 8, y: top - 82, size: 7, font, color: MUTED });
  page.drawText(fitText(input.buyerPhone, bold, 8, CANHOTO_W - 36), {
    x: x + 26,
    y: top - 82,
    size: 8,
    font: bold,
    color: INK,
  });
  dottedLine(page, x + 24, top - 85, split - 8, top - 85);

  const br = buildParishPixCopiaECola({
    amountCents: input.ticketPriceCents,
    transactionId: `RIFA${label}`,
    account: RAFFLE_SICREDI_PAYMENT,
  });
  if (br) {
    const png = await QRCode.toBuffer(br, { type: "png", margin: 0, width: 160 });
    const image = await pdf.embedPng(png);
    page.drawImage(image, { x: x + 8, y: y + 18, width: 42, height: 42 });
  }
  page.drawText(fitText(`PIX ${price}`, bold, 7, CANHOTO_W - 58), {
    x: x + 54,
    y: y + 34,
    size: 7,
    font: bold,
    color: INK,
  });

  const bodyX = split + 10;
  const bodyW = x + w - bodyX - 10;
  page.drawRectangle({ x: split, y: top - 22, width: w - CANHOTO_W, height: 22, color: NAVY });
  page.drawText("RIFA BENEFICENTE", { x: bodyX, y: top - 15, size: 9, font: bold, color: WHITE });

  page.drawText(fitText(input.parishName, bold, 10, bodyW - 70), {
    x: bodyX,
    y: top - 38,
    size: 10,
    font: bold,
    color: INK,
  });
  page.drawText("PRÊMIO", { x: bodyX, y: top - 52, size: 7, font: bold, color: MUTED });
  const prizeLines = wrapText(input.prizeTitle, bold, 11, bodyW - 78, 2);
  prizeLines.forEach((line, index) => {
    page.drawText(line, { x: bodyX, y: top - 66 - index * 13, size: 11, font: bold, color: INK });
  });

  const numberSize = 20;
  const numberWidth = bold.widthOfTextAtSize(label, numberSize);
  page.drawText(label, {
    x: x + w - 12 - numberWidth,
    y: top - 58,
    size: numberSize,
    font: bold,
    color: GOLD,
  });

  const priceY = y + 28;
  dottedLine(page, split + 8, priceY + 16, x + w - 8, priceY + 16);
  page.drawText(price, { x: bodyX, y: priceY, size: 13, font: bold, color: INK });
  const unit = "por número";
  const unitWidth = font.widthOfTextAtSize(unit, 8);
  page.drawText(unit, { x: x + w - 12 - unitWidth, y: priceY + 2, size: 8, font, color: MUTED });
  page.drawText("Guarde este bilhete. Ele é seu comprovante.", {
    x: bodyX,
    y: y + 12,
    size: 7,
    font,
    color: MUTED,
  });
}
