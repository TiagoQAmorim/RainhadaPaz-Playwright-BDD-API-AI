const SAFE_COLOR =
  /^(#[0-9a-f]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|hsl\(\s*\d{1,3}(?:\.\d+)?\s*,\s*\d{1,3}(?:\.\d+)?%\s*,\s*\d{1,3}(?:\.\d+)?%\s*\))$/i;

/** Mantém só `style="color: …"` seguro em spans do editor. */
function sanitizeInlineColorStyles(html: string): string {
  return html.replace(/\sstyle=(["'])([^"']*)\1/gi, (full, quote, styleBody) => {
    const colorDecl = styleBody
      .split(";")
      .map((s: string) => s.trim())
      .find((s: string) => /^color\s*:/i.test(s));
    if (!colorDecl) return "";
    const value = colorDecl.replace(/^color\s*:\s*/i, "").trim();
    if (!SAFE_COLOR.test(value)) return "";
    return ` style=${quote}color: ${value}${quote}`;
  });
}

/** Remove tags executáveis antes de gravar HTML do editor. */
export function sanitizeAdminHtml(html: string): string {
  let out = String(html ?? "").trim();
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");
  out = out.replace(/\son\w+\s*=\s*(['"])[\s\S]*?\1/gi, "");
  out = out.replace(/javascript:/gi, "");
  out = sanitizeInlineColorStyles(out);
  return out;
}