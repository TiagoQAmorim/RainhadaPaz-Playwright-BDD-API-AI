const CATEQUESE_HUB = `
<p>A catequese na Paróquia Rainha da Paz prepara crianças, jovens e adultos para viver a fé e receber os sacramentos. Escolha o caminho que corresponde à sua idade e situação:</p>
<ul>
  <li><a href="/sacramentos/catequese-infantil"><strong>Catequese infantil</strong></a> — a partir de 7 anos (leitura e escrita); preparação para Batismo, Confissão e Primeira Eucaristia.</li>
  <li><a href="/sacramentos/crisma-jovens"><strong>Crisma de jovens</strong></a> — a partir de 14 anos, para quem já fez a Primeira Comunhão.</li>
  <li><a href="/sacramentos/crisma"><strong>Crisma (catequese de adultos)</strong></a> — catecumenato para jovens e adultos que precisam dos sacramentos da iniciação cristã.</li>
</ul>
<p>Horários, taxas e inscrições: consulte a página específica ou fale com a <a href="/contato">secretaria paroquial</a> (WhatsApp no site).</p>
`;

const CONTATO_BODY = `
<p>Fale com a secretaria paroquial pelo telefone <strong>(11) 5524-5657</strong> ou pelo WhatsApp (ícone no canto da tela).</p>
<p><strong>Endereço:</strong> R. Sócrates, 813 — Vila Sofia, São Paulo — SP, CEP 04671-072</p>
<p><strong>Atendimento da secretaria:</strong> terça a sexta, 13h às 20h; sábado, 9h às 17h.</p>
`;

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function isEffectivelyEmpty(html: string): boolean {
  return stripTags(html).length < 25;
}

export function sanitizeWpHtml(
  html: string,
  options?: { slug?: string },
): string {
  let out = html;

  out = out.replace(/https?:\/\/www2\.paroquiarainhadapaz\.com\.br/gi, "https://paroquiarainhadapaz.com.br");
  out = out.replace(/<span[^>]*>/gi, "").replace(/<\/span>/gi, "");
  out = out.replace(/\sstyle="[^"]*"/gi, "");
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/\[(\/)?[^\]]+\]/g, "");

  out = out.replace(/<iframe[\s\S]*?<\/iframe>/gi, (block) => {
    if (/calendar\.google|group\.calendar\.google/i.test(block)) return "";
    return block;
  });

  out = out.replace(/<form[\s\S]*?<\/form>/gi, "");
  out = out.replace(/<div[^>]*id="contact-form-result"[^>]*>[\s\S]*?<\/div>/gi, "");
  out = out.replace(/<div[^>]*class="[^"]*g-recaptcha[^"]*"[\s\S]*?<\/div>/gi, "");

  out = out.replace(/<p>\s*<strong>\s*AGENDA[\s\S]*?<\/strong>\s*<\/p>/gi, "");
  out = out.replace(/<strong>\s*AGENDA\s*<\/strong>/gi, "");
  out = out.replace(/Verifique a agenda abaixo[^<]*\./gi, "Consulte a secretaria paroquial para datas.");
  out = out.replace(/Veja abaixo a agenda[^<]*\./gi, "Consulte a secretaria paroquial para datas.");
  out = out.replace(/Confira abaixo as datas agendadas[^<]*\./gi, "Consulte a secretaria para datas de curso e batizado.");
  out = out.replace(/Verifique a agenda abaixo com as principais datas[^<]*\./gi, "Consulte a secretaria para datas e inscrições.");

  out = out.replace(/\bPadre Davi\b/gi, "Padre Rodrigo Amaral");
  out = out.replace(/\bPe\.\s*Davi\b/gi, "Pe. Rodrigo Amaral");

  out = out.replace(/<p>\s*<\/p>/gi, "");
  out = out.replace(/(<hr[^>]*>\s*){2,}/gi, "<hr class=\"my-8 border-parish-200\" />");
  out = out.trim();

  const slug = options?.slug;
  if (slug === "catequese" && isEffectivelyEmpty(out)) {
    out = `${out}\n${CATEQUESE_HUB}`;
  } else if (slug === "catequese" && stripTags(out).length < 120) {
    out = `${out}\n${CATEQUESE_HUB}`;
  }

  if (slug === "contato" && (isEffectivelyEmpty(out) || /<iframe/i.test(out) && stripTags(out).length < 80)) {
    out = CONTATO_BODY;
  }

  return out.trim();
}
