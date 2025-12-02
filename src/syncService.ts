import { App, TFile } from "obsidian";
import { RiverClient } from "./riverClient";
import { NoteCreator } from "./noteCreator";
import type { RiverPluginSettings } from "./settings";
import type { PendingEmail } from "./types";

export class SyncService {
  private app: App;
  private client: RiverClient;
  private noteCreator: NoteCreator;
  private settings: RiverPluginSettings;

  constructor(app: App, client: RiverClient, settings: RiverPluginSettings) {
    this.app = app;
    this.client = client;
    this.settings = settings;
    this.noteCreator = new NoteCreator(app, settings);
  }

  /**
   * Sync all pending notes from River
   * Returns the number of notes synced
   */
  async syncPendingNotes(): Promise<number> {
    console.debug("River: Starting sync...");

    // Fetch pending emails
    const emails = await this.client.getPendingEmails();

    if (emails.length === 0) {
      console.debug("River: No pending emails to sync");
      return 0;
    }

    console.debug(`River: Syncing ${emails.length} emails...`);

    let syncedCount = 0;
    const errors: string[] = [];

    // Process each email
    for (const email of emails) {
      try {
        await this.syncEmail(email);
        syncedCount++;
      } catch (error) {
        console.error(`River: Failed to sync email ${email.id}:`, error);
        errors.push(`${email.subject}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.warn(`River: ${errors.length} emails failed to sync:`, errors);
    }

    console.debug(
      `River: Sync complete. Synced ${syncedCount}/${emails.length} emails`,
    );
    return syncedCount;
  }

  /**
   * Sync a single email
   */
  private async syncEmail(email: PendingEmail): Promise<void> {
    console.debug(`River: Syncing email: ${email.subject}`);

    // Create the note
    const file = await this.noteCreator.createNote(email);

    // Prepare metadata
    const metadata = {
      notePath: file.path,
      tags: email.topics.map((topic) => `${this.settings.tagPrefix}${topic}`),
      frontmatter: {
        river_id: email.id,
        type: email.contentType,
        received: email.receivedAt,
      },
    };

    // Mark as synced in River (pass source to use correct endpoint)
    await this.client.markAsSynced(email.id, metadata, email.source || "email");

    console.debug(`River: Successfully synced: ${email.subject} -> ${file.path}`);
  }

  /**
   * Update the note creator when settings change
   */
  updateSettings(settings: RiverPluginSettings): void {
    this.settings = settings;
    this.noteCreator = new NoteCreator(this.app, settings);
  }

  /**
   * Update the client reference (called when credentials change)
   */
  updateClient(client: RiverClient): void {
    this.client = client;
  }
}
