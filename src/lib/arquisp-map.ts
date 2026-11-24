const SOURCE_URL = "https://arquisp.org.br/mapa/";
const TTL_MS = 60 * 60 * 1000;

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const MAP_DOCUMENT_VERSION = 5;

let cache: { html: string; at: number; version: number } | null = null;
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
  script = script.replace("input.style.width = '200px';", "input.style.width = '100%';");
  script = script.replace(
    "popupContent += '<h3><a href=\"' + parish.url + '\">' + parish.title + '</a></h3>';",
    `popupContent += '<h3><a href="' + parish.url + '">' + parish.title + '</a></h3>';
popupContent += '<p class="parish-routes"><a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(parish.lat + ',' + parish.lon) + '" target="_blank" rel="noopener">Google Maps</a> · <a href="https://www.waze.com/ul?ll=' + encodeURIComponent(parish.lat + ',' + parish.lon) + '&navigate=yes" target="_blank" rel="noopener">Waze</a></p>';`,
  );
  script = attachParishSearchBridge(script);

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
  #parish-map-1-search { width: min(40rem, calc(100% - 1rem)) !important; }
  .leaflet-bottom.leaflet-right { margin-bottom: 4.75rem; }
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
  if (link.classList.contains("leaflet-popup-close-button")) return;
  var href = link.getAttribute("href") || "";
  if (href.charAt(0) === "#") return;
  if (link.protocol === "tel:") return;
  event.preventDefault();
  window.open(link.href, "_blank", "noopener,noreferrer");
}, true);
</script>
<script defer src="${leafletJs}"></script>
</body>
</html>`;
}

const INPUT_LISTENER =
  /searchInput\.addEventListener\(\s*'input'\s*,\s*function\s*\(\s*e\s*\)\s*\{\s*filterMarkersOnly\(\);\s*(?:\/\/[^\n]*)?\s*\}\s*\)\s*;/;

const CLEAR_LISTENER =
  /clearBtn\.addEventListener\(\s*'click'\s*,\s*function\s*\(\s*\)\s*\{\s*searchInput\.value\s*=\s*''\s*;\s*filterMarkersOnly\(\);\s*\}\s*\)\s*;/;

const TITLE_CHECK =
  /var titleNormalized = removeAccents\(item\.data\.title\.toLowerCase\(\)\);\s*if \(titleNormalized\.indexOf\(queryNormalized\) !== -1\) \{/;

const PARISH_SEARCH_BRIDGE = `
function decodeParishText(value) {
  return String(value || "")
    .replace(/&#(\\d+);/g, function (_, n) { return String.fromCharCode(parseInt(n, 10)); })
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\\u00a0/g, " ");
}
function parishMatchesQuery(data, queryNormalized) {
  var text = removeAccents(decodeParishText(data.title).toLowerCase());
  var words = String(queryNormalized || "").split(/\\s+/).filter(Boolean);
  if (!words.length) return false;
  for (var i = 0; i < words.length; i++) {
    if (text.indexOf(words[i]) === -1) return false;
  }
  return true;
}
function publishParishResults() {
  var items = [];
  for (var i = 0; i < matchedParishes.length; i++) {
    var data = matchedParishes[i].data;
    items.push({
      id: data.id,
      title: decodeParishText(data.title || ""),
      address: decodeParishText(data.address || ""),
      phone: data.phone || "",
      lat: data.lat,
      lon: data.lon
    });
  }
  window.parent.postMessage({
    source: "rainhada-mapa",
    type: "results",
    query: searchInput.value.trim(),
    total: matchedParishes.length,
    items: items
  }, "*");
}
function showParishById(id) {
  for (var i = 0; i < matchedParishes.length; i++) {
    if (String(matchedParishes[i].data.id) === String(id)) {
      currentMatchIndex = i;
      showCurrentMatch();
      return;
    }
  }
}
window.addEventListener("message", function (event) {
  var data = event.data;
  if (!data || data.source !== "rainhada-mapa") return;
  if (data.type === "show") showParishById(data.id);
  if (data.type === "resize" && map && map.invalidateSize) map.invalidateSize();
  if (data.type === "query") {
    searchInput.value = String(data.query || "");
    filterMarkersOnly();
    publishParishResults();
  }
});
["keydown", "keypress", "keyup"].forEach(function (type) {
  searchInput.addEventListener(type, function (event) {
    event.stopPropagation();
  });
});
`;

/** Avisa a página do site quais paróquias bateram com a busca, e centraliza a escolhida. */
export function attachParishSearchBridge(script: string): string {
  if (!INPUT_LISTENER.test(script) || script.includes("function publishParishResults")) return script;
  let next = script.replace(TITLE_CHECK, "if (parishMatchesQuery(item.data, queryNormalized)) {");
  next = next.replace(
    INPUT_LISTENER,
    `${PARISH_SEARCH_BRIDGE}
searchInput.addEventListener('input', function(e) {
  filterMarkersOnly();
  publishParishResults();
});`,
  );
  next = next.replace(
    CLEAR_LISTENER,
    `clearBtn.addEventListener('click', function() {
  searchInput.value = '';
  filterMarkersOnly();
  publishParishResults();
});`,
  );
  return next;
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
  if (cache && cache.version === MAP_DOCUMENT_VERSION && Date.now() - cache.at < TTL_MS) return cache.html;

  const res = await fetch(SOURCE_URL, {
    cache: "no-store",
    headers: {
      Accept: "text/html",
      "User-Agent": "RainhadaPaz/mapa (+https://paroquiarainhadapaz.com.br)",
    },
  });
  if (!res.ok) throw new Error(`Mapa da Arquidiocese respondeu ${res.status}`);
  const html = buildArquispMapDocument(await res.text());
  cache = { html, at: Date.now(), version: MAP_DOCUMENT_VERSION };
  return html;
}
