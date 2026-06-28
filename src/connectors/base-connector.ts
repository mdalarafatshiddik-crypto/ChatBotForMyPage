export interface UnifiedMessage {
  externalMessageId: string;
  senderExternalId: string;
  recipientExternalId: string;
  text?: string;
  attachments?: Array<{
    type: "image" | "video" | "file" | "audio";
    url: string;
  }>;
  timestamp: Date;
}

export interface ConnectorConfig {
  accessToken: string;
  providerId: string; // E.g., Facebook Page ID, WhatsApp Phone ID
}

export abstract class BaseConnector {
  abstract channelType: string;
  protected accessToken: string;
  protected providerId: string;

  constructor(config: ConnectorConfig) {
    this.accessToken = config.accessToken;
    this.providerId = config.providerId;
  }

  /**
   * Parses webhook payloads into unified standard messages
   */
  abstract parseWebhook(payload: any): UnifiedMessage[];

  /**
   * Sends a message back to the user via the specific channel API
   */
  abstract sendMessage(recipientId: string, text: string, attachments?: any[]): Promise<boolean>;

  /**
   * Sets typing indicators or equivalent state on the channel
   */
  abstract sendTypingIndicator(recipientId: string, isTyping: boolean): Promise<void>;
}
