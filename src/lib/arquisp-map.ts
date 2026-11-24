const SOURCE_URL = "https://arquisp.org.br/mapa/";
const TTL_MS = 60 * 60 * 1000;

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

let cache: { html: string; at: number } | null = null;
let cartoKey = "";

export function rememberCartoKey(key: string) {
  if (key) cartoKey = key;
}

export async function ensureCartoKey(): Promise<string> {
  if (cartoKey) return cartoKey;
  await getArquispMapDocument();
  if (!cartoKey) throw new Error("Mapa da Arquidiocese sem chave de azulejos");
  return cartoKey;
}

/** A página da Arquidiocese envia X-Frame-Options: SAMEORIGIN, então o site deles não abre dentro do nosso. Este documento fica só com o mapa e a busca. */
export function buildArquispMapDocument(sourceHtml: string): string {
  const cssIdAt = sourceHtml.indexOf('id="parish-map-inlined-css"');
  const cssTag = cssIdAt >= 0 ? sourceHtml.lastIndexOf("<style", cssIdAt) : -1;
  const cssEnd = cssIdAt >= 0 ? sourceHtml.indexOf("</style>", cssIdAt) : -1;
  const wrap = sourceHtml.indexOf('<div class="parish-map-wrapper">');
  const scriptStart = wrap >= 0 ? sourceHtml.indexOf("<script>", wrap) : -1;
  const scriptEnd = scriptStart >= 0 ? sourceHtml.indexOf("</script>", scriptStart) : -1;

  if (cssTag < 0 || cssEnd < 0 || wrap < 0 || scriptStart < 0 || scriptEnd < 0) {
    throw new Error("Mapa da Arquidiocese sem o bloco esperado");
  }

  const css = sourceHtml.slice(cssTag, cssEnd + "</style>".length);
  const widget = sourceHtml.slice(wrap, scriptStart);
  let script = sourceHtml.slice(scriptStart, scriptEnd + "</script>".length);
  if (!script.includes("var parishData") || !script.includes("parishData.forEach")) {
    throw new Error("Mapa da Arquidiocese sem a lista de paróquias");
  }

  const key = script.match(/var cartoKey = "([^"]*)";/)?.[1] ?? "";
  rememberCartoKey(key);
  // A chave só é aceita com o referer do site deles. O navegador pede os azulejos em /mapa-arquisp/tiles.
  script = script.replace(/var cartoKey = "[^"]*";/, 'var cartoKey = "";');
  if (!script.includes("basemaps.cartocdn.com/rastertiles/voyager/")) {
    throw new Error("Mapa da Arquidiocese sem a camada de ruas");
  }
  script = script.replace(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    "/mapa-arquisp/tiles/{z}/{x}/{y}",
  );

  const leafletCss =
    sourceHtml.match(/https:\/\/unpkg\.com\/leaflet@[\d.]+\/dist\/leaflet\.css/)?.[0] ?? LEAFLET_CSS;
  const leafletJs =
    sourceHtml.match(/https:\/\/unpkg\.com\/leaflet@[\d.]+\/dist\/leaflet\.js/)?.[0] ?? LEAFLET_JS;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mapa de Paróquias</title>
<link rel="stylesheet" href="${leafletCss}">
${css}
<style>
  html, body { margin: 0; height: 100%; background: #f7f5f2; }
  .parish-map-wrapper, #parish-map-1 {
    height: 100% !important;
    min-height: 100%;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  .leaflet-bottom.leaflet-right { margin-bottom: 4.75rem; }
  @media (max-width: 700px) {
    #parish-map-1-search { width: 9.5rem !important; }
  }
</style>
</head>
<body>
${widget}
${script}
<script>
document.addEventListener("click", function (event) {
  var node = event.target;
  if (!node || !node.closest) return;
  var link = node.closest("a[href]");
  if (!link || link.target === "_blank") return;
  if (link.protocol === "tel:") return;
  event.preventDefault();
  window.open(link.href, "_blank", "noopener,noreferrer");
}, true);
</script>
<script defer src="${leafletJs}"></script>
</body>
</html>`;
}

export function arquispMapFallbackDocument(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mapa de Paróquias</title>
</head>
<body style="margin:0;font-family:sans-serif;background:#f7f5f2;color:#3d3428">
  <p style="padding:24px">O mapa da Arquidiocese não carregou agora. <a href="${SOURCE_URL}" target="_blank" rel="noopener noreferrer">Abrir o mapa no site da Arquidiocese</a>.</p>
</body>
</html>`;
}

export async function getArquispMapDocument(): Promise<string> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.html;

  const res = await fetch(SOURCE_URL, {
    cache: "no-store",
    headers: {
      Accept: "text/html",
      "User-Agent": "RainhadaPaz/mapa (+https://paroquiarainhadapaz.com.br)",
    },
  });
  if (!res.ok) throw new Error(`Mapa da Arquidiocese respondeu ${res.status}`);
  const html = buildArquispMapDocument(await res.text());
  cache = { html, at: Date.now() };
  return html;
}
