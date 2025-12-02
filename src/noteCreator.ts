import { App, TFile, moment } from "obsidian";
import type { PendingEmail } from "./types";
import type { RiverPluginSettings } from "./settings";

export class NoteCreator {
  private app: App;
  private settings: RiverPluginSettings;

  constructor(app: App, settings: RiverPluginSettings) {
    this.app = app;
    this.settings = settings;
  }

  /**
   * Create a markdown note from a pending email
   */
  async createNote(email: PendingEmail): Promise<TFile> {
    const filename = this.generateFilename(email);
    const filepath = this.settings.inboxFolder + filename;
    const content = this.generateContent(email);

    // Check if folder exists, create if not
    await this.ensureFolderExists(this.settings.inboxFolder);

    // Check if file already exists
    const existingFile = this.app.vault.getAbstractFileByPath(filepath);
    if (existingFile instanceof TFile) {
      console.debug(`River: File already exists, updating: ${filepath}`);
      await this.app.vault.modify(existingFile, content);
      return existingFile;
    }

    // Create new file
    console.debug(`River: Creating note: ${filepath}`);
    const file = await this.app.vault.create(filepath, content);
    return file;
  }

  /**
   * Generate filename for the note
   */
  private generateFilename(email: PendingEmail): string {
    const date = moment(email.receivedAt).format("MM-DD-YYYY");
    const sanitizedSubject = this.sanitizeFilename(email.subject);
    // Sanitize the entire filename to be extra safe
    const fullFilename = `${date} - ${sanitizedSubject}`;
    return this.sanitizeFilename(fullFilename) + ".md";
  }

  /**
   * Sanitize filename by removing invalid characters
   * Ensures filename is filesystem-safe across all platforms
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[\\/:*?"<>|]/g, "") // Remove Windows/Unix invalid chars
      .replace(/\s+/g, " ") // Collapse multiple spaces to single space
      .replace(/^\.+/, "") // Remove leading dots (hidden files)
      .trim()
      .substring(0, 200); // Limit length (was 100, increased for date + title)
  }

  /**
   * Generate markdown content for the note
   */
  private generateContent(email: PendingEmail): string {
    let content = "";

    // Add frontmatter if enabled
    if (this.settings.addFrontmatter) {
      content += this.generateFrontmatter(email);
      content += "\n";
    }

    // Add title
    content += `# ${email.subject}\n\n`;

    // Add main content
    content += `${email.content}\n`;

    // Add URLs if any
    if (email.urls && email.urls.length > 0) {
      content += `\n## Links\n\n`;
      email.urls.forEach((url) => {
        content += `- ${url}\n`;
      });
    }

    // Add tags section
    if (email.topics && email.topics.length > 0) {
      content += `\n---\n\n`;
      const tags = email.topics.map(
        (topic) => `#${this.settings.tagPrefix}${this.sanitizeTag(topic)}`,
      );
      content += tags.join(" ");
    }

    return content;
  }

  /**
   * Generate YAML frontmatter
   */
  private generateFrontmatter(email: PendingEmail): string {
    let frontmatter = "---\n";
    frontmatter += `received: ${moment(email.receivedAt).format("MM/DD/YYYY hh:mm A")}\n`;

    if (email.topics && email.topics.length > 0) {
      frontmatter += `topics:\n`;
      email.topics.forEach((topic) => {
        frontmatter += `  - ${topic}\n`;
      });
    }

    if (email.eventDetails?.date) {
      frontmatter += `event_date: ${email.eventDetails.date}\n`;
    }

    if (email.eventDetails?.time) {
      frontmatter += `event_time: ${email.eventDetails.time}\n`;
    }

    frontmatter += "---\n";
    return frontmatter;
  }

  /**
   * Get emoji for content type
   */
  private getTypeEmoji(contentType: string): string {
    switch (contentType) {
      case "note":
        return "📝";
      case "event":
        return "📅";
      case "task":
        return "✅";
      case "mixed":
        return "🔀";
      default:
        return "📄";
    }
  }

  /**
   * Sanitize tag by removing special characters
   */
  private sanitizeTag(tag: string): string {
    return tag
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  /**
   * Ensure folder exists, create if not
   */
  private async ensureFolderExists(folderPath: string): Promise<void> {
    const folder = folderPath.replace(/\/$/, ""); // Remove trailing slash
    if (!folder) return; // Root folder

    const exists = this.app.vault.getAbstractFileByPath(folder);
    if (!exists) {
      console.debug(`River: Creating folder: ${folder}`);
      await this.app.vault.createFolder(folder);
    }
  }
}
