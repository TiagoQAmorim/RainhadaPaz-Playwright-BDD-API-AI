import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

export function mercadoPagoEnabled() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());
}

function client() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
  return new MercadoPagoConfig({ accessToken: token });
}

export async function createCandlePreference(params: {
  candleId: string;
  title: string;
  amount: number;
  payerEmail?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const preference = new Preference(client());

  const result = await preference.create({
    body: {
      items: [
        {
          id: params.candleId,
          title: params.title,
          quantity: 1,
          unit_price: params.amount,
          currency_id: "BRL",
        },
      ],
      payer: params.payerEmail ? { email: params.payerEmail } : undefined,
      payment_methods: {
        excluded_payment_types: [],
        installments: 12,
      },
      back_urls: {
        success: `${siteUrl}/velas/sucesso?candle=${params.candleId}`,
        failure: `${siteUrl}/velas/erro?candle=${params.candleId}`,
        pending: `${siteUrl}/velas/pendente?candle=${params.candleId}`,
      },
      auto_return: "approved",
      external_reference: params.candleId,
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
    },
  });

  return result;
}

export async function getPayment(paymentId: string) {
  const payment = new Payment(client());
  return payment.get({ id: paymentId });
}

export async function createRaffleOrderPreference(params: {
  orderId: string;
  title: string;
  amount: number;
  quantity: number;
  payerEmail?: string;
  successPath: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const preference = new Preference(client());
  const unitPrice = params.quantity > 0 ? params.amount / params.quantity : params.amount;

  const result = await preference.create({
    body: {
      items: [
        {
          id: params.orderId,
          title: params.title,
          quantity: params.quantity,
          unit_price: unitPrice,
          currency_id: "BRL",
        },
      ],
      payer: params.payerEmail ? { email: params.payerEmail } : undefined,
      back_urls: {
        success: `${siteUrl}${params.successPath}`,
        failure: `${siteUrl}${params.successPath}?status=failure`,
        pending: `${siteUrl}${params.successPath}?status=pending`,
      },
      auto_return: "approved",
      external_reference: params.orderId,
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
    },
  });

  return result;
}
