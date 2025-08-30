export interface TemplateContext {
  page_title: string;
  page_path: string;
  vault_name: string;
}

export function applyTemplate(str: string, ctx: TemplateContext): string {
  return str.replace(/\{(.*?)\}/g, (_, key) => {
    const val = (ctx as any)[key];
    return val !== undefined ? String(val) : "";
  });
}

export function buildQuery(tpl: Record<string, string>, ctx: TemplateContext): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(tpl)) {
    params.set(k, applyTemplate(v, ctx));
  }
  return params.toString();
}
