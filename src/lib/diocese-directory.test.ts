import { describe, expect, it } from "vitest";
import { parseDioceseDirectory, parseParishAddress, phoneForPlace } from "./diocese-directory";

const html = `
<h1>| Setor Cupecê</h1>
<h2 class="post-title"><a href="/jose">Paróquia São José</a></h2>
<div class="entry-content"><p>Fundação em 30/10/1960<br />Telefone: 11 5588-0002 </p></div>
<h1>| Setor Sabará</h1>
<h2 class="post-title"><a href="/pedro">Paróquia São Pedro Apóstolo</a></h2>
<div class="entry-content"><p>Telefone: 11 2609-7574</p></div>
<h2 class="post-title"><a href="/jose2">Paróquia São José</a></h2>
<div class="entry-content"><p>Telefone: 11 5928-3734 / Fax: 5928-3734</p></div>
`;

describe("parseDioceseDirectory", () => {
  const directory = parseDioceseDirectory(html);

  it("lê o telefone de cada paróquia no setor", () => {
    expect(directory).toEqual([
      { sector: "Cupecê", title: "Paróquia São José", phone: "11 5588-0002", url: "https://diocesedesantoamaro.org.br/jose" },
      { sector: "Sabará", title: "Paróquia São Pedro Apóstolo", phone: "11 2609-7574", url: "https://diocesedesantoamaro.org.br/pedro" },
      { sector: "Sabará", title: "Paróquia São José", phone: "11 5928-3734 / Fax: 5928-3734", url: "https://diocesedesantoamaro.org.br/jose2" },
    ]);
  });

  it("escolhe o telefone do mesmo setor quando o nome se repete", () => {
    expect(phoneForPlace({ title: "Paróquia São José", sector: "Setor Sabará" }, directory)).toBe(
      "11 5928-3734 / Fax: 5928-3734",
    );
    expect(phoneForPlace({ title: "Paróquia São Pedro Apóstolo", sector: "Setor Sabará" }, directory)).toBe(
      "11 2609-7574",
    );
    expect(phoneForPlace({ title: "Comunidade São Pedro", sector: "Setor Sabará" }, directory)).toBe("");
  });

  it("aceita o nome do mapa quando a diocese escreve um pouco diferente", () => {
    const extra = [
      ...directory,
      { sector: "Grajaú", title: "Paróquia São Lucas Evangelista", phone: "11 9 8215-4242", url: "" },
      { sector: "Pedreira", title: "Paróquia Santa Clara e São Francisco de Assis", phone: "11 5622-0164", url: "" },
      { sector: "Sabará", title: "Santuário Nossa Senhora Mãe de Deus", phone: "11 5687-9133", url: "" },
      { sector: "Santa Catarina", title: "Paróquia Santo Antonio de Santana Galvão", phone: "11 5678-3109", url: "" },
      { sector: "Santo Amaro", title: "Paróquia Universitária São Carlo Acutis", phone: "11 5974-2282", url: "" },
    ];
    expect(
      phoneForPlace(
        { title: "Paróquia São Lucas Evangelista (Forania Grajaú - Diocese de Santo Amaro)", sector: "Setor Grajaú" },
        extra,
      ),
    ).toBe("11 9 8215-4242");
    expect(phoneForPlace({ title: "Paróquia Santa Clara e São Francisco", sector: "Setor Pedreira" }, extra)).toBe(
      "11 5622-0164",
    );
    expect(phoneForPlace({ title: "Santuário Mãe de Deus", sector: "Setor Sabará" }, extra)).toBe("11 5687-9133");
    expect(
      phoneForPlace(
        { title: "Paróquia Santo Antônio Santana Galvão", sector: "Setor Santo Amaro e Setor Santa Catarina" },
        extra,
      ),
    ).toBe("11 5678-3109");
    expect(
      phoneForPlace(
        { title: "Paróquia Universitária Beato Carlo Acutis", sector: "Setor Santo Amaro e Setor Santa Catarina" },
        extra,
      ),
    ).toBe("11 5974-2282");
  });
});

describe("parseParishAddress", () => {
  it("junta a rua, o número e o CEP", () => {
    const html = `<h3>Endereço</h3>
<h2>Rua Profº. Guilherme Belfort Sabino, 953 – Vl. São Pedro<br />
<span class="line2">04678-001 &#8211; São Paulo, SP</span></h2>`;
    expect(parseParishAddress(html)).toBe(
      "Rua Profº. Guilherme Belfort Sabino, 953 – Vl. São Pedro — 04678-001 – São Paulo, SP",
    );
  });
});
