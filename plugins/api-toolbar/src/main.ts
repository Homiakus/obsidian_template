import { Plugin, Notice, requestUrl, TFile, setIcon } from "obsidian";
import {
  DEFAULT_SETTINGS,
  PluginSettings,
  ButtonConfig,
} from "./settings";
import ApiToolbarSettingTab from "./ui/settings-tab";
import { applyTemplate, buildQuery, TemplateContext } from "./utils/template";

export default class ApiToolbarPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;
  private panelEl!: HTMLElement;
  private running = new Set<string>();

  async onload() {
    await this.loadSettings();
    this.panelEl = this.createPanel();
    this.registerEvent(this.app.workspace.on("layout-change", () => this.renderPanel()));
    this.registerEvent(this.app.workspace.on("file-open", () => this.renderPanel()));
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.renderPanel())
    );
    this.registerEvent(this.app.workspace.on("theme-change", () => this.renderPanel()));
    this.addSettingTab(new ApiToolbarSettingTab(this.app, this));
    this.renderPanel();
  }

  onunload() {
    this.panelEl.remove();
  }

  private createPanel(): HTMLElement {
    const el = document.createElement("div");
    el.className = "api-toolbar";
    document.body.appendChild(el);
    this.register(() => el.remove());
    return el;
  }

  renderPanel() {
    const file = this.app.workspace.getActiveFile();
    this.panelEl.empty();
    this.settings.buttons
      .filter((b) => b.enabled)
      .forEach((b) => {
        const btn = document.createElement("button");
        btn.className = "api-toolbar-button";
        btn.setAttr("aria-label", b.label);
        const icon = btn.createSpan({ cls: "icon" });
        setIcon(icon, b.icon);
        btn.createSpan({ text: b.label, cls: "label" });
        btn.disabled = !file;
        btn.onclick = () => this.handleClick(b, btn);
        this.panelEl.appendChild(btn);
      });
    if (!file) {
      const span = document.createElement("span");
      span.textContent = "Open a note to enable";
      this.panelEl.appendChild(span);
    }
  }

  async handleClick(b: ButtonConfig, btn: HTMLElement) {
    if (this.running.has(b.id)) {
      new Notice("Already running");
      return;
    }
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile)) {
      new Notice("No active file");
      return;
    }
    const ctx: TemplateContext = {
      page_title: file.basename,
      page_path: file.path,
      vault_name: this.app.vault.getName(),
    };
    let url = this.settings.api.baseUrl.replace(/\/$/, "") + b.endpoint;
    const params = new URLSearchParams(
      b.queryTemplate ? buildQuery(b.queryTemplate, ctx) : ""
    );
    if (b.passPageTitle) params.set("title", ctx.page_title);
    if (b.passPagePath) params.set("path", ctx.page_path);
    if (b.passVaultName) params.set("vault", ctx.vault_name);
    const qs = params.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;

    let body: string | undefined;
    if (b.method === "POST") {
      if (b.contentType === "application/json") {
        let obj: Record<string, any> = {};
        if (b.payloadTemplate) {
          try {
            obj = JSON.parse(applyTemplate(b.payloadTemplate, ctx));
          } catch {
            obj = {};
          }
        }
        if (b.passPageTitle) obj.title = ctx.page_title;
        if (b.passPagePath) obj.path = ctx.page_path;
        if (b.passVaultName) obj.vault = ctx.vault_name;
        body = JSON.stringify(obj);
      } else if (b.contentType === "application/x-www-form-urlencoded") {
        const p = new URLSearchParams();
        if (b.payloadTemplate) {
          const q = buildQuery(
            Object.fromEntries(
              b.payloadTemplate
                .split("&")
                .filter(Boolean)
                .map((part) => part.split("=", 2) as [string, string])
            ),
            ctx
          );
          q.split("&").forEach((pair) => {
            const [k, v] = pair.split("=");
            if (k) p.set(k, v);
          });
        }
        if (b.passPageTitle) p.set("title", ctx.page_title);
        if (b.passPagePath) p.set("path", ctx.page_path);
        if (b.passVaultName) p.set("vault", ctx.vault_name);
        body = p.toString();
      } else {
        body = applyTemplate(b.payloadTemplate ?? "", ctx);
        const extras: string[] = [];
        if (b.passPageTitle) extras.push(`title=${ctx.page_title}`);
        if (b.passPagePath) extras.push(`path=${ctx.page_path}`);
        if (b.passVaultName) extras.push(`vault=${ctx.vault_name}`);
        if (extras.length) body += (body ? "\n" : "") + extras.join("\n");
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": b.contentType,
      ...this.settings.api.headers,
    };
    if (this.settings.api.auth.type === "bearer" && this.settings.api.auth.token) {
      headers["Authorization"] = `Bearer ${this.settings.api.auth.token}`;
    } else if (
      this.settings.api.auth.type === "header" &&
      this.settings.api.auth.headerName &&
      this.settings.api.auth.token
    ) {
      headers[this.settings.api.auth.headerName] = this.settings.api.auth.token;
    }

    // HTTPS enforcement
    if (
      !this.settings.api.allowHttp &&
      url.toLowerCase().startsWith("http:")
    ) {
      new Notice("Insecure HTTP blocked");
      return;
    }

    this.running.add(b.id);
    btn.addClass("is-running");
    const spinner = btn.createSpan({ cls: "spinner" });
    try {
      const timeout = b.timeoutMs ?? this.settings.api.timeoutMs;
      let attempt = 0;
      const max = this.settings.api.retry.retries + 1;
      while (attempt < max) {
        try {
          const controller = new AbortController();
          const timer = window.setTimeout(() => controller.abort(), timeout);
          const res = await requestUrl({
            url,
            method: b.method,
            headers,
            body,
            signal: controller.signal,
          });
          window.clearTimeout(timer);
          if (res.status >= 200 && res.status < 300) {
            new Notice("OK");
            return;
          }
          new Notice(`Error: ${res.status}`);
          return;
        } catch (e) {
          attempt++;
          if (attempt >= max) throw e;
          await new Promise((r) =>
            setTimeout(r, this.settings.api.retry.backoffMs * attempt)
          );
        }
      }
    } catch (e) {
      new Notice("Request failed");
      console.error(e);
    } finally {
      this.running.delete(b.id);
      spinner.remove();
      btn.removeClass("is-running");
    }
  }

  async loadSettings() {
    const data = await this.loadData();
    if (data) this.settings = { ...DEFAULT_SETTINGS, ...data };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
