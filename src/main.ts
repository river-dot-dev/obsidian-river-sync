import { Plugin, Notice } from "obsidian";
import { RiverSettingTab, DEFAULT_SETTINGS } from "./settings";
import { RiverClient } from "./riverClient";
import { SyncService } from "./syncService";
import type { RiverPluginSettings } from "./settings";

export default class RiverPlugin extends Plugin {
  settings: RiverPluginSettings;
  client: RiverClient;
  syncService: SyncService;
  syncInterval: number | null = null;

  async onload() {
    console.debug("Loading River Sync plugin");

    // Load settings
    await this.loadSettings();

    // Initialize services
    this.client = new RiverClient(
      this.settings.apiUrl,
      this.settings.userId,
      this.settings.smsApiUrl,
    );
    this.syncService = new SyncService(this.app, this.client, this.settings);

    // Add ribbon icon for manual sync
    this.addRibbonIcon("sync", "Sync River notes", async () => {
      await this.syncNotes();
    });

    // Add command for manual sync
    this.addCommand({
      id: "sync-notes",
      name: "Sync notes",
      callback: async () => {
        await this.syncNotes();
      },
    });

    // Add command to test connection
    this.addCommand({
      id: "test-connection",
      name: "Test connection",
      callback: async () => {
        await this.testConnection();
      },
    });

    // Add settings tab
    this.addSettingTab(new RiverSettingTab(this.app, this));

    // Auto-sync on startup if enabled
    if (this.settings.syncOnStartup) {
      // Delay startup sync by 2 seconds to let Obsidian fully load
      setTimeout(() => {
        void this.syncNotes();
      }, 2000);
    }

    // Start periodic sync if interval > 0
    if (this.settings.syncInterval > 0) {
      this.startPeriodicSync();
    }
  }

  onunload() {
    console.debug("Unloading River Sync plugin");
    this.stopPeriodicSync();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);

    // Reinitialize client with new settings
    this.client = new RiverClient(
      this.settings.apiUrl,
      this.settings.userId,
      this.settings.smsApiUrl,
    );

    // Update sync service with new settings and client
    this.syncService.updateSettings(this.settings);
    this.syncService.updateClient(this.client);

    // Restart periodic sync with new interval
    this.stopPeriodicSync();
    if (this.settings.syncInterval > 0) {
      this.startPeriodicSync();
    }
  }

  async syncNotes() {
    if (!this.settings.userId || !this.settings.token) {
      new Notice("⚠️ Please connect to River in settings first");
      return;
    }

    try {
      new Notice("🔄 Syncing notes from River...");
      const count = await this.syncService.syncPendingNotes();

      if (count > 0) {
        new Notice(
          `✅ Synced ${count} note${count !== 1 ? "s" : ""} from River`,
        );
      } else {
        new Notice("✓ No new notes to sync");
      }
    } catch (error) {
      console.error("River sync failed:", error);
      new Notice(`❌ Sync failed: ${error.message}`);
    }
  }

  async testConnection() {
    new Notice("🔍 Testing River connection...");

    try {
      const isConnected = await this.client.testConnection();

      if (isConnected) {
        new Notice("✅ Connected to River successfully!");
      } else {
        new Notice("❌ Failed to connect to River. Check your API URL.");
      }
    } catch (error) {
      console.error("River connection test failed:", error);
      new Notice(`❌ Connection test failed: ${error.message}`);
    }
  }

  startPeriodicSync() {
    const intervalMs = this.settings.syncInterval * 60 * 1000;
    console.debug(
      `River: Starting periodic sync every ${this.settings.syncInterval} minutes`,
    );

    this.syncInterval = window.setInterval(() => {
      void this.syncNotes();
    }, intervalMs);
  }

  stopPeriodicSync() {
    if (this.syncInterval !== null) {
      console.debug("River: Stopping periodic sync");
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}
