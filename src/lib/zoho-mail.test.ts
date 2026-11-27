import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearZohoMailCache, sendZohoMail, ZohoMailError } from "./zoho-mail";

const KEYS = [
  "ZOHO_CLIENT_ID",
  "ZOHO_CLIENT_SECRET",
  "ZOHO_REFRESH_TOKEN",
  "ZOHO_ACCOUNT_ID",
  "ZOHO_FROM_EMAIL",
  "ZOHO_ACCOUNTS_URL",
  "ZOHO_MAIL_API_URL",
] as const;

const saved = new Map<string, string | undefined>();

function setZohoEnv() {
  process.env.ZOHO_CLIENT_ID = "client-id";
  process.env.ZOHO_CLIENT_SECRET = "client-secret";
  process.env.ZOHO_REFRESH_TOKEN = "refresh-token-value";
  process.env.ZOHO_ACCOUNT_ID = "12345";
  process.env.ZOHO_FROM_EMAIL = "vela@paroquia.test";
  process.env.ZOHO_ACCOUNTS_URL = "https://accounts.zoho.com";
  process.env.ZOHO_MAIL_API_URL = "https://mail.zoho.com";
}

function tokenOk(token = "access-1") {
  return new Response(JSON.stringify({ access_token: token, expires_in: 3600 }), { status: 200 });
}

function sentOk() {
  return new Response(JSON.stringify({ status: { code: 200, description: "success" } }), { status: 200 });
}

beforeEach(() => {
  clearZohoMailCache();
  for (const key of KEYS) saved.set(key, process.env[key]);
  for (const key of KEYS) delete process.env[key];
});

afterEach(() => {
  clearZohoMailCache();
  for (const [key, value] of saved) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendZohoMail", () => {
  it("não chama a rede quando falta alguma variável", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendZohoMail({ to: "a@paroquia.test", subject: "Oi", text: "Texto" })).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renova o token e envia o texto em HTTPS na API de mensagens", async () => {
    setZohoEnv();
    const fetchMock = vi.fn(async (url: string, init?: { body?: unknown; headers?: { Authorization?: string } }) => {
      void init;
      return String(url).includes("oauth") ? tokenOk() : sentOk();
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sendZohoMail({ to: "destino@paroquia.test", subject: "Vela", text: "Olá\nAna" }),
    ).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const tokenCall = fetchMock.mock.calls[0];
    expect(String(tokenCall?.[0])).toBe("https://accounts.zoho.com/oauth/v2/token");
    expect(String(tokenCall?.[1]?.body)).toContain("grant_type=refresh_token");
    const messageCall = fetchMock.mock.calls[1];
    expect(String(messageCall?.[0])).toBe("https://mail.zoho.com/api/accounts/12345/messages");
    expect(messageCall?.[1]?.headers?.Authorization).toBe("Zoho-oauthtoken access-1");
    expect(JSON.parse(String(messageCall?.[1]?.body))).toEqual({
      fromAddress: "vela@paroquia.test",
      toAddress: "destino@paroquia.test",
      subject: "Vela",
      content: "Olá\nAna",
      mailFormat: "plaintext",
      encoding: "UTF-8",
    });
  });

  it("reaproveita o access token e manda HTML quando o texto é HTML", async () => {
    setZohoEnv();
    const fetchMock = vi.fn(async (url: string, init?: { body?: unknown; headers?: { Authorization?: string } }) => {
      void init;
      return String(url).includes("oauth") ? tokenOk() : sentOk();
    });
    vi.stubGlobal("fetch", fetchMock);

    await sendZohoMail({ to: "a@paroquia.test", subject: "Um", text: "texto" });
    await sendZohoMail({ to: "a@paroquia.test", subject: "Dois", text: "<p>Olá</p>" });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[2]?.[0])).toContain("/api/accounts/12345/messages");
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body)).mailFormat).toBe("html");
  });

  it("pede outro token quando o Zoho responde 401 e não devolve o segredo no erro", async () => {
    setZohoEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenOk("access-velho"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "INVALID_OAUTHTOKEN" }), { status: 401 }))
      .mockResolvedValueOnce(tokenOk("access-novo"))
      .mockResolvedValueOnce(sentOk());
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendZohoMail({ to: "a@paroquia.test", subject: "Oi", text: "Texto" })).resolves.toBe(true);
    expect(fetchMock.mock.calls[3]?.[1]?.headers?.Authorization).toBe("Zoho-oauthtoken access-novo");
  });

  it("recusa HTTP e não inclui o refresh token na mensagem", async () => {
    setZohoEnv();
    process.env.ZOHO_ACCOUNTS_URL = "http://accounts.zoho.com";
    vi.stubGlobal("fetch", vi.fn());

    await expect(sendZohoMail({ to: "a@paroquia.test", subject: "Oi", text: "Texto" })).rejects.toThrow(ZohoMailError);
    await expect(sendZohoMail({ to: "a@paroquia.test", subject: "Oi", text: "Texto" })).rejects.toThrow(
      /porta 443/,
    );
    try {
      await sendZohoMail({ to: "a@paroquia.test", subject: "Oi", text: "Texto" });
    } catch (error) {
      expect(error instanceof Error ? error.message : "").not.toContain("refresh-token-value");
      expect(error instanceof Error ? error.message : "").not.toContain("client-secret");
    }
  });
});
