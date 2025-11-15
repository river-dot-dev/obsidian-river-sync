import type {
  PendingEmail,
  SyncResponse,
  MarkSyncedResponse,
  ObsidianMetadata,
} from "./types";

export class RiverClient {
  private apiUrl: string;
  private smsApiUrl: string;
  private userId: string;

  constructor(apiUrl: string, userId: string, smsApiUrl?: string) {
    this.apiUrl = apiUrl.replace(/\/$/, ""); // Remove trailing slash
    this.smsApiUrl = (smsApiUrl || "https://river-sms.fly.dev").replace(
      /\/$/,
      "",
    );
    this.userId = userId;
  }

  /**
   * Fetch pending emails from River staging API
   */
  async getPendingEmails(): Promise<PendingEmail[]> {
    if (!this.userId) {
      throw new Error("User ID not configured");
    }

    const url = `${this.apiUrl}/api/staging/${this.userId}/pending`;
    console.log(`River: Fetching pending emails from ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch pending emails: ${response.status} ${response.statusText}`,
      );
    }

    const data: SyncResponse = await response.json();

    if (!data.success) {
      throw new Error("API returned success=false");
    }

    console.log(`River: Found ${data.count} pending emails`);

    // Mark all emails with source
    const emails = data.emails.map((email) => ({
      ...email,
      source: "email" as const,
    }));

    // Also fetch SMS messages
    const smsMessages = await this.getPendingSms();

    // Merge and return
    const allMessages = [...emails, ...smsMessages];
    console.log(
      `River: Total pending messages: ${allMessages.length} (${emails.length} emails, ${smsMessages.length} SMS)`,
    );
    return allMessages;
  }

  /**
   * Fetch pending SMS messages from River SMS service
   */
  async getPendingSms(): Promise<PendingEmail[]> {
    if (!this.userId) {
      throw new Error("User ID not configured");
    }

    try {
      const url = `${this.smsApiUrl}/api/sms/staging/pending?userId=${this.userId}`;
      console.log(`River: Fetching pending SMS from ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        console.warn(
          `River: Failed to fetch SMS (${response.status}), continuing with emails only`,
        );
        return [];
      }

      const data = await response.json();

      if (!data.messages || !Array.isArray(data.messages)) {
        console.warn("River: Invalid SMS response format");
        return [];
      }

      console.log(`River: Found ${data.messages.length} pending SMS`);

      // Transform SMS messages to PendingEmail format
      return data.messages.map((sms: any) => {
        const receivedDate = new Date(sms.received_at);

        return {
          id: String(sms.id),
          subject: sms.ai_summary || "SMS Note",
          content: sms.ai_enhanced_content || sms.body,
          urls: sms.detected_urls || [],
          topics: sms.suggested_topics || [],
          receivedAt: receivedDate.getTime(),
          contentType: sms.content_type || "note",
          eventDetails: sms.event_details
            ? JSON.parse(sms.event_details)
            : null,
          source: "sms" as const,
          from: sms.from_phone,
        };
      });
    } catch (error) {
      console.warn(
        "River: Failed to fetch SMS, continuing with emails only:",
        error,
      );
      return [];
    }
  }

  /**
   * Mark an email or SMS as synced to Obsidian
   */
  async markAsSynced(
    messageId: string,
    metadata: ObsidianMetadata,
    source: "email" | "sms" = "email",
  ): Promise<void> {
    if (source === "sms") {
      // Mark SMS as synced
      const url = `${this.smsApiUrl}/api/sms/staging/${messageId}/synced`;
      console.log(`River: Marking SMS ${messageId} as synced`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ obsidianMetadata: metadata }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to mark SMS as synced: ${response.status} ${response.statusText}`,
        );
      }

      return;
    }

    // Mark email as synced
    const url = `${this.apiUrl}/api/staging/${messageId}/mark-synced`;
    console.log(`River: Marking email ${messageId} as synced`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ obsidianMetadata: metadata }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to mark email as synced: ${response.status} ${response.statusText}`,
      );
    }

    const data: MarkSyncedResponse = await response.json();

    if (!data.success) {
      throw new Error("Failed to mark email as synced");
    }
  }

  /**
   * Test the connection to the River API
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.apiUrl}/health`;
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      console.error("River: Connection test failed:", error);
      return false;
    }
  }
}
