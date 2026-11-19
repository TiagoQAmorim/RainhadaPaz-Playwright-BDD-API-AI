"use client";

import { useState } from "react";
import { adminInput } from "@/components/admin/AdminFormStyles";
import {
  formatTicketNumber,
  numberSeriesEnd,
  RAFFLE_NUMBER_MAX_TICKETS,
  RAFFLE_NUMBER_MAX_VALUE,
  RAFFLE_TICKET_QUANTITY_OPTIONS,
} from "@/lib/raffle-rules";

export function AdminRaffleQuantityFields() {
  const [kind, setKind] = useState<"SAINTS" | "NUMBERS">("SAINTS");
  const [count, setCount] = useState(1500);
  const [start, setStart] = useState(1);
  const end = numberSeriesEnd(start, count);
  const seriesOk = start >= 1 && count >= 1 && count <= RAFFLE_NUMBER_MAX_TICKETS && end <= RAFFLE_NUMBER_MAX_VALUE;

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Tipo da rifa</label>
        <select
          name="kind"
          className={adminInput}
          value={kind}
          onChange={(e) => setKind(e.target.value === "NUMBERS" ? "NUMBERS" : "SAINTS")}
        >
          <option value="SAINTS">Santos</option>
          <option value="NUMBERS">Números (0001, 0002… até {RAFFLE_NUMBER_MAX_TICKETS})</option>
        </select>
      </div>
      {kind === "SAINTS" ? (
        <div>
          <label className="mb-1 block text-sm font-medium">Quantidade de cotas</label>
          <select name="totalTickets" className={adminInput} defaultValue="100" required>
            {RAFFLE_TICKET_QUANTITY_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} cotas
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium">Quantidade no site</label>
          <input
            name="totalTickets"
            type="number"
            min={1}
            max={RAFFLE_NUMBER_MAX_TICKETS}
            value={count}
            required
            className={adminInput}
            onChange={(e) => setCount(Number(e.target.value))}
          />
          <label className="mb-1 mt-3 block text-sm font-medium">Começa no número</label>
          <input
            name="numberStart"
            type="number"
            min={1}
            max={RAFFLE_NUMBER_MAX_VALUE}
            value={start}
            required
            className={adminInput}
            onChange={(e) => setStart(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-parish-600">
            {seriesOk
              ? start <= 1
                ? `O site vende de ${formatTicketNumber(start)} a ${formatTicketNumber(end)}.`
                : `O site vende de ${formatTicketNumber(start)} a ${formatTicketNumber(end)}. Os números anteriores ficam no talão impresso.`
              : `Até ${RAFFLE_NUMBER_MAX_TICKETS} números no site, e o último não pode passar de ${RAFFLE_NUMBER_MAX_VALUE}.`}
          </p>
        </div>
      )}
    </div>
  );
}
