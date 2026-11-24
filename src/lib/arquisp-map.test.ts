import { describe, expect, it } from "vitest";
import { buildArquispMapDocument } from "./arquisp-map";

const source = `<!DOCTYPE html><html><head>
<link rel='stylesheet' id='map-leaflet-css' href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css?ver=1.9.4' />
<style id="parish-map-inlined-css" media="all">.parish-map-wrapper{width:100%}</style>
</head><body>
<header><nav>Liturgia Clero Paróquias</nav></header>
<div class="parish-map-wrapper">
  <div id="parish-map-1" class="parish-map-container"></div>
</div>
<script>
document.addEventListener('DOMContentLoaded', function() {
  var parishData = [{"id":1,"title":"Paróquia Teste","lat":-23.5,"lon":-46.6}];
  var cartoKey = "chave-so-no-site-deles";
  var tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
  parishData.forEach(function() {});
});
</script>
<script defer src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js?ver=1.9.4"></script>
<footer>Arquidiocese</footer>
</body></html>`;

describe("buildArquispMapDocument", () => {
  it("fica só com o mapa e a busca, sem o menu da Arquidiocese", () => {
    const html = buildArquispMapDocument(source);
    expect(html).toContain('id="parish-map-1"');
    expect(html).toContain("var parishData");
    expect(html).toContain('var cartoKey = "";');
    expect(html).toContain("/mapa-arquisp/tiles/{z}/{x}/{y}");
    expect(html).not.toContain("basemaps.cartocdn.com");
    expect(html).not.toContain("chave-so-no-site-deles");
    expect(html).not.toContain("<nav>Liturgia");
    expect(html).not.toContain("<footer>Arquidiocese");
    expect(html).toContain("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
  });

  it("recusa html sem o mapa", () => {
    expect(() => buildArquispMapDocument("<html></html>")).toThrow(/bloco esperado/);
  });
});
