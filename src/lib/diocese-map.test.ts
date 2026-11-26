import { describe, expect, it } from "vitest";
import { cepDigits } from "./diocese-geocode";
import { parseDioceseKml } from "./diocese-map";
import { parseDioceseTerritories, territoryAt } from "./diocese-territory";

const kml = `<?xml version="1.0"?>
<kml><Document>
<Folder><name>Setor Pedreira</name>
  <Placemark><name>Paróquia São Pedro Apóstolo</name>
    <description>https://diocesedesantoamaro.org.br/pedro</description>
    <Point><coordinates>-46.70,-23.71,0</coordinates></Point>
  </Placemark>
  <Placemark><name>Território</name>
    <Polygon><outerBoundaryIs><coordinates>-46,-23 -46.1,-23.1</coordinates></outerBoundaryIs></Polygon>
  </Placemark>
</Folder>
</Document></kml>`;

describe("parseDioceseKml", () => {
  it("fica com as igrejas e ignora o polígono do território", () => {
    const places = parseDioceseKml(kml);
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({
      title: "Paróquia São Pedro Apóstolo",
      sector: "Setor Pedreira",
      lat: -23.71,
      lon: -46.7,
      siteUrl: "https://diocesedesantoamaro.org.br/pedro",
      phone: "",
      address: "",
    });
  });
});

describe("território da paróquia", () => {
  const square = `<?xml version="1.0"?>
<kml><Document>
<Folder><name>Setor Sul</name>
  <Placemark><name>DIOCESE DE SANTOS</name>
    <Polygon><outerBoundaryIs><coordinates>0,0 0,10 10,10 10,0 0,0</coordinates></outerBoundaryIs></Polygon>
  </Placemark>
  <Placemark><name>Paróquia São Pedro</name>
    <Polygon><outerBoundaryIs><coordinates>0,0 0,4 4,4 4,0 0,0</coordinates></outerBoundaryIs></Polygon>
  </Placemark>
  <Placemark><name>Santuário São Judas</name>
    <Polygon><outerBoundaryIs><coordinates>1,1 1,2 2,2 2,1 1,1</coordinates></outerBoundaryIs></Polygon>
  </Placemark>
</Folder>
</Document></kml>`;

  it("ignora o contorno de outra diocese e fica com o território menor", () => {
    const territories = parseDioceseTerritories(square);
    expect(territories.map((item) => item.title)).toEqual(["Paróquia São Pedro", "Santuário São Judas"]);
    expect(territoryAt(territories, 1.5, 1.5)?.title).toBe("Santuário São Judas");
    expect(territoryAt(territories, 3, 3)?.title).toBe("Paróquia São Pedro");
    expect(territoryAt(territories, 8, 8)).toBeNull();
  });
});

describe("cepDigits", () => {
  it("aceita CEP e recusa endereço com letras", () => {
    expect(cepDigits("04849-000")).toBe("04849000");
    expect(cepDigits("CEP 04849-000")).toBe("04849000");
    expect(cepDigits("Rua das Flores, 100")).toBeNull();
  });
});
