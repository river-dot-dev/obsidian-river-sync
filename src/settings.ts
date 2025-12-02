import { App, PluginSettingTab, Setting, requestUrl } from "obsidian";
import type RiverPlugin from "./main";

export interface RiverPluginSettings {
  apiUrl: string; // River email service URL
  smsApiUrl: string; // River SMS service URL
  syncApiUrl: string; // River sync service URL
  userId: string; // User's Clerk ID
  token: string; // OAuth token
  syncOnStartup: boolean; // Auto-sync when Obsidian opens
  syncInterval: number; // Minutes between syncs (0 = manual only)
  inboxFolder: string; // Where to create notes (e.g., "Inbox/")
  tagPrefix: string; // Prefix for auto-tags (e.g., "river/")
  addFrontmatter: boolean; // Add YAML frontmatter
  dateFormat: string; // Date format for filenames
}

export const DEFAULT_SETTINGS: RiverPluginSettings = {
  apiUrl: "https://river-email.fly.dev",
  smsApiUrl: "https://river-sms.fly.dev",
  syncApiUrl: "https://river-dev-sync.fly.dev",
  userId: "",
  token: "",
  syncOnStartup: true,
  syncInterval: 5, // 5 minutes
  inboxFolder: "Inbox/",
  tagPrefix: "river/",
  addFrontmatter: true,
  dateFormat: "YYYY-MM-DD",
};

export class RiverSettingTab extends PluginSettingTab {
  plugin: RiverPlugin;
  private pollingInterval: number | null = null;

  constructor(app: App, plugin: RiverPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl).setName("River sync settings").setHeading();

    // Connection Status Section
    this.displayConnectionStatus(containerEl);

    // Sync Configuration
    new Setting(containerEl).setName("Sync configuration").setHeading();

    new Setting(containerEl)
      .setName("Sync on startup")
      .setDesc("Automatically sync notes when Obsidian opens")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.syncOnStartup)
          .onChange(async (value) => {
            this.plugin.settings.syncOnStartup = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Sync interval")
      .setDesc("Minutes between automatic syncs (0 = manual only)")
      .addText((text) =>
        text
          .setPlaceholder("5")
          .setValue(String(this.plugin.settings.syncInterval))
          .onChange(async (value) => {
            const interval = parseInt(value);
            if (!isNaN(interval) && interval >= 0) {
              this.plugin.settings.syncInterval = interval;
              await this.plugin.saveSettings();
            }
          }),
      );

    // Note Organization
    new Setting(containerEl).setName("Note organization").setHeading();

    new Setting(containerEl)
      .setName("Inbox folder")
      .setDesc("Folder path for synced notes (e.g., Inbox/ or Daily/)")
      .addText((text) =>
        text
          .setPlaceholder("Inbox/")
          .setValue(this.plugin.settings.inboxFolder)
          .onChange(async (value) => {
            this.plugin.settings.inboxFolder = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Tag prefix")
      .setDesc("Prefix for auto-generated tags (e.g., river/)")
      .addText((text) =>
        text
          .setPlaceholder("river/")
          .setValue(this.plugin.settings.tagPrefix)
          .onChange(async (value) => {
            this.plugin.settings.tagPrefix = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Add frontmatter")
      .setDesc("Add metadata properties to synced notes (received date, topics)")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.addFrontmatter)
          .onChange(async (value) => {
            this.plugin.settings.addFrontmatter = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Date format")
      .setDesc("Date format for note filenames (using moment.js)")
      .addText((text) =>
        text
          .setPlaceholder("YYYY-MM-DD")
          .setValue(this.plugin.settings.dateFormat)
          .onChange(async (value) => {
            this.plugin.settings.dateFormat = value;
            await this.plugin.saveSettings();
          }),
      );
  }

  displayConnectionStatus(containerEl: HTMLElement): void {
    const section = containerEl.createDiv({ cls: "river-connection-section" });
    new Setting(section).setName("Connection").setHeading();

    const isConnected =
      this.plugin.settings.userId && this.plugin.settings.token;

    if (isConnected) {
      // Connected state
      const statusDiv = section.createDiv({ cls: "river-status-connected" });
      statusDiv.createEl("p", {
        text: "✅ Connected to River",
      });

      new Setting(section)
        .setName("Disconnect")
        .setDesc("Clear your River credentials and disconnect")
        .addButton((button) =>
          button
            .setButtonText("Disconnect")
            .setCta()
            .onClick(async () => {
              this.plugin.settings.userId = "";
              this.plugin.settings.token = "";
              await this.plugin.saveSettings();
              this.display(); // Refresh display
            }),
        );
    } else {
      // Not connected state
      const statusDiv = section.createDiv({ cls: "river-status-disconnected" });
      statusDiv.createEl("p", {
        text: "⚠️ Not connected to River",
      });

      new Setting(section)
        .setName("Connect to River")
        .setDesc("Authorize this plugin to access your River account")
        .addButton((button) =>
          button
            .setButtonText("Connect")
            .setCta()
            .onClick(async () => {
              await this.initiateOAuthFlow();
            }),
        );
    }
  }

  async initiateOAuthFlow(): Promise<void> {
    try {
      // Create OAuth session
      const response = await requestUrl({
        url: `${this.plugin.settings.syncApiUrl}/api/oauth/session`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status >= 400) {
        throw new Error("Failed to create OAuth session");
      }

      const data = response.json;

      if (!data.success) {
        throw new Error(data.error || "Failed to create OAuth session");
      }

      // Open browser to authorization URL
      window.open(data.authUrl, "_blank");

      // Start polling for authorization
      this.startPolling(data.sessionId);
    } catch (error) {
      console.error("OAuth flow error:", error);
      // Show error to user
      const errorDiv = document.createElement("div");
      errorDiv.className = "river-error";
      errorDiv.textContent = `Failed to connect: ${error.message}`;
      this.containerEl.insertBefore(errorDiv, this.containerEl.firstChild);
    }
  }

  startPolling(sessionId: string): void {
    let attempts = 0;
    const maxAttempts = 90; // 15 minutes (90 * 10 seconds)

    this.pollingInterval = window.setInterval(() => {
      void this.pollSession(sessionId, attempts, maxAttempts);
      attempts++;
    }, 2000); // Poll every 2 seconds
  }

  private async pollSession(
    sessionId: string,
    attempts: number,
    maxAttempts: number,
  ): Promise<void> {
    if (attempts > maxAttempts) {
      this.stopPolling();
      console.warn("OAuth session expired");
      return;
    }

    try {
      const response = await requestUrl(
        `${this.plugin.settings.syncApiUrl}/api/oauth/session/${sessionId}`,
      );

      if (response.status >= 400) {
        throw new Error("Failed to check session status");
      }

      const data = response.json;

      if (data.state === "authorized") {
        // Success! Save credentials
        this.plugin.settings.userId = data.userId;
        this.plugin.settings.token = data.token;
        this.plugin.settings.apiUrl = data.emailApiUrl;
        this.plugin.settings.smsApiUrl = data.smsApiUrl;
        await this.plugin.saveSettings();

        this.stopPolling();
        this.display(); // Refresh display

        // Show success message
        const successDiv = document.createElement("div");
        successDiv.className = "river-success";
        successDiv.textContent = "✅ Successfully connected to River!";
        this.containerEl.insertBefore(
          successDiv,
          this.containerEl.firstChild,
        );

        // Remove success message after 3 seconds
        setTimeout(() => {
          successDiv.remove();
        }, 3000);
      } else if (data.state === "expired") {
        this.stopPolling();
        console.warn("OAuth session expired");
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  }

  stopPolling(): void {
    if (this.pollingInterval !== null) {
      window.clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  hide(): void {
    // Clean up polling when settings are closed
    this.stopPolling();
  }
}
