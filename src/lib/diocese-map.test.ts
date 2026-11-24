import { describe, expect, it } from "vitest";
import { parseDioceseKml } from "./diocese-map";

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
