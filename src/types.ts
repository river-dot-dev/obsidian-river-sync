export type ContentType = "note" | "event" | "task" | "mixed";
export type MessageSource = "email" | "sms";

export interface PendingEmail {
  id: string;
  subject: string;
  content: string; // AI-enhanced markdown with intelligent tagging
  urls: string[];
  topics: string[];
  receivedAt: number;
  contentType: ContentType;
  eventDetails?: EventDetails | null;
  source?: MessageSource; // Added to distinguish email vs SMS
  from?: string; // Phone number for SMS, email address for email
}

export interface EventDetails {
  title: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  endTime?: string;
  location?: string;
  description?: string;
  attendees?: string[];
}

export interface SyncResponse {
  success: boolean;
  count: number;
  emails: PendingEmail[];
}

export interface MarkSyncedResponse {
  success: boolean;
  message: string;
  emailId: string;
}

export interface ObsidianMetadata {
  notePath: string;
  tags?: string[];
  frontmatter?: Record<string, unknown>;
}

export interface SmsApiResponse {
  id: number;
  ai_summary?: string;
  ai_enhanced_content?: string;
  body: string;
  detected_urls?: string[];
  suggested_topics?: string[];
  received_at: string;
  content_type?: string;
  event_details?: string;
  from_phone?: string;
}
