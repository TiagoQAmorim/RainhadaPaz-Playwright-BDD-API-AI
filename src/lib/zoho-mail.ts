const ZOHO_ENV_KEYS = [
  "ZOHO_CLIENT_ID",
  "ZOHO_CLIENT_SECRET",
  "ZOHO_REFRESH_TOKEN",
  "ZOHO_ACCOUNT_ID",
  "ZOHO_FROM_EMAIL",
  "ZOHO_ACCOUNTS_URL",
  "ZOHO_MAIL_API_URL",
] as const;

type ZohoEnvKey = (typeof ZOHO_ENV_KEYS)[number];

export class ZohoMailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZohoMailError";
  }
}

export type ZohoMailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type ZohoConfig = Record<ZohoEnvKey, string>;

let cachedToken: { value: string; expiresAt: number } | null = null;
let refreshing: Promise<string> | null = null;

export function clearZohoMailCache() {
  cachedToken = null;
  refreshing = null;
}

function envValue(name: string): string | undefined {
  const direct = process.env[name]?.trim();
  if (direct) return direct;
  for (const key of Object.keys(process.env)) {
    if (key !== name && key.trim() === name) {
      const value = process.env[key]?.trim();
      if (value) return value;
    }
  }
  return undefined;
}

function readConfig(): ZohoConfig | null {
  const values = {} as ZohoConfig;
  for (const key of ZOHO_ENV_KEYS) {
    const value = envValue(key);
    if (!value) return null;
    values[key] = value;
  }
  return values;
}

function https443(raw: string, name: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ZohoMailError(`${name} não é um endereço válido.`);
  }
  if (url.protocol !== "https:") {
    throw new ZohoMailError(`${name} precisa ser HTTPS na porta 443.`);
  }
  if (url.port && url.port !== "443") {
    throw new ZohoMailError(`${name} precisa ser HTTPS na porta 443.`);
  }
  url.search = "";
  url.hash = "";
  return url;
}

function tokenUrl(accountsUrl: string): string {
  const url = https443(accountsUrl, "ZOHO_ACCOUNTS_URL");
  const path = url.pathname.replace(/\/+$/, "");
  url.pathname = path.endsWith("/oauth/v2/token") ? path || "/" : `${path}/oauth/v2/token`;
  return url.toString();
}

function messagesUrl(mailApiUrl: string, accountId: string): string {
  if (!/^[A-Za-z0-9]+$/.test(accountId)) {
    throw new ZohoMailError("ZOHO_ACCOUNT_ID inválido.");
  }
  const url = https443(mailApiUrl, "ZOHO_MAIL_API_URL");
  const path = url.pathname.replace(/\/+$/, "");
  const root = path === "" || path === "/" ? "" : path;
  const apiRoot = root.endsWith("/api") ? root : `${root}/api`;
  url.pathname = `${apiRoot}/accounts/${accountId}/messages`;
  return url.toString();
}

function looksLikeHtml(content: string) {
  return /<\/?(?:p|br|div|span|a|table|tr|td|html|body|h[1-6]|ul|ol|li|strong|em|img)\b/i.test(
    content,
  );
}

function safeCode(value: unknown): string {
  return typeof value === "string" && /^[A-Za-z0-9_ .:/-]{1,40}$/.test(value) ? value : "erro";
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const payload = (await response.json()) as unknown;
    return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function refreshAccessToken(config: ZohoConfig): Promise<string> {
  const response = await fetch(tokenUrl(config.ZOHO_ACCOUNTS_URL), {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.ZOHO_CLIENT_ID,
      client_secret: config.ZOHO_CLIENT_SECRET,
      refresh_token: config.ZOHO_REFRESH_TOKEN,
    }),
  });
  const payload = await readJson(response);
  const accessToken = typeof payload.access_token === "string" ? payload.access_token : "";
  if (!response.ok || !accessToken) {
    console.error("[zoho-mail] token", response.status, safeCode(payload.error));
    throw new ZohoMailError(
      "O Zoho não renovou o acesso. Confira ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET e ZOHO_REFRESH_TOKEN no servidor.",
    );
  }
  const seconds = Number(payload.expires_in);
  const ttlMs = (Number.isFinite(seconds) && seconds > 0 ? seconds : 3600) * 1000;
  cachedToken = { value: accessToken, expiresAt: Date.now() + Math.max(ttlMs - 60_000, 30_000) };
  return accessToken;
}

async function accessToken(config: ZohoConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  if (!refreshing) {
    refreshing = refreshAccessToken(config).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function postMessage(config: ZohoConfig, message: ZohoMailMessage, token: string, retried: boolean): Promise<void> {
  const content = message.html ?? message.text;
  const mailFormat = message.html || looksLikeHtml(message.text) ? "html" : "plaintext";
  const response = await fetch(messagesUrl(config.ZOHO_MAIL_API_URL, config.ZOHO_ACCOUNT_ID), {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fromAddress: config.ZOHO_FROM_EMAIL,
      toAddress: message.to,
      subject: message.subject,
      content,
      mailFormat,
      encoding: "UTF-8",
    }),
  });
  if (response.status === 401 && !retried) {
    cachedToken = null;
    return postMessage(config, message, await refreshAccessToken(config), true);
  }
  const payload = await readJson(response);
  const status = payload.status;
  const statusCode =
    status && typeof status === "object" ? Number((status as { code?: unknown }).code) : response.status;
  const description =
    status && typeof status === "object" ? (status as { description?: unknown }).description : payload.error;
  if (!response.ok || (Number.isFinite(statusCode) && statusCode >= 400)) {
    console.error("[zoho-mail] envio", response.status, safeCode(description));
    throw new ZohoMailError(
      response.status === 401
        ? "O Zoho recusou o acesso."
        : "O Zoho não aceitou o e-mail. Confira ZOHO_ACCOUNT_ID e ZOHO_FROM_EMAIL.",
    );
  }
}

/** Envia pela API do Zoho em HTTPS. Retorna false só quando as variáveis não estão no servidor. */
export async function sendZohoMail(message: ZohoMailMessage): Promise<boolean> {
  const config = readConfig();
  if (!config) return false;
  await postMessage(config, message, await accessToken(config), false);
  return true;
}
