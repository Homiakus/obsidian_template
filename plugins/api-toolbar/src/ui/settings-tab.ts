import { App, PluginSettingTab, Setting } from "obsidian";
import type ApiToolbarPlugin from "../main";

export default class ApiToolbarSettingTab extends PluginSettingTab {
  plugin: ApiToolbarPlugin;

  constructor(app: App, plugin: ApiToolbarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "API Toolbar" });

    new Setting(containerEl)
      .setName("API base URL")
      .setDesc("Base URL of external service")
      .addText((text) =>
        text
          .setPlaceholder("https://api.example.com")
          .setValue(this.plugin.settings.api.baseUrl)
          .onChange(async (value) => {
            this.plugin.settings.api.baseUrl = value;
            await this.plugin.saveSettings();
          })
      );

    this.plugin.settings.buttons.forEach((btn, i) => {
      const s = new Setting(containerEl).setName(`Button ${i + 1}`);
      s.addText((t) =>
        t.setValue(btn.label).onChange(async (v) => {
          btn.label = v;
          await this.plugin.saveSettings();
          this.plugin.renderPanel();
        })
      );
      s.addText((t) =>
        t
          .setPlaceholder("icon id")
          .setValue(btn.icon)
          .onChange(async (v) => {
            btn.icon = v;
            await this.plugin.saveSettings();
            this.plugin.renderPanel();
          })
      );
      s.addText((t) =>
        t
          .setPlaceholder("/endpoint")
          .setValue(btn.endpoint)
          .onChange(async (v) => {
            btn.endpoint = v;
            await this.plugin.saveSettings();
          })
      );
      s.addDropdown((d) =>
        d
          .addOptions({ GET: "GET", POST: "POST" })
          .setValue(btn.method)
          .onChange(async (v) => {
            btn.method = v as any;
            await this.plugin.saveSettings();
          })
      );
      s.addToggle((t) =>
        t.setValue(btn.enabled).onChange(async (v) => {
          btn.enabled = v;
          await this.plugin.saveSettings();
          this.plugin.renderPanel();
        })
      );
    });
  }
}
