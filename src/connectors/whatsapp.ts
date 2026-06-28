import { BaseConnector, UnifiedMessage } from "./base-connector";

export class WhatsAppConnector extends BaseConnector {
  channelType = "WHATSAPP_CLOUD";

  parseWebhook(payload: any): UnifiedMessage[] {
    const messages: UnifiedMessage[] = [];

    if (!payload.entry) return messages;

    for (const entry of payload.entry) {
      if (!entry.changes) continue;

      for (const change of entry.changes) {
        const value = change.value;
        if (!value || !value.messages) continue;

        const phoneId = value.metadata?.phone_number_id;

        for (const message of value.messages) {
          const unifiedMsg: UnifiedMessage = {
            externalMessageId: message.id,
            senderExternalId: message.from, // Customer's phone number
            recipientExternalId: phoneId || this.providerId, // Business phone number ID
            timestamp: new Date(parseInt(message.timestamp) * 1000),
          };

          if (message.type === "text" && message.text) {
            unifiedMsg.text = message.text.body;
          } else if (message.type === "image" && message.image) {
            unifiedMsg.text = message.image.caption || "Sent an image";
            unifiedMsg.attachments = [{
              type: "image",
              url: message.image.id, // In WhatsApp, media ID is sent; we need to fetch it later
            }];
          } else if (message.type === "document" && message.document) {
            unifiedMsg.text = message.document.filename || "Sent a document";
            unifiedMsg.attachments = [{
              type: "file",
              url: message.document.id,
            }];
          }

          messages.push(unifiedMsg);
        }
      }
    }

    return messages;
  }

  async sendMessage(recipientPhone: string, text: string, attachments?: any[]): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/v20.0/${this.providerId}/messages`;
      
      let payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone,
      };

      if (attachments && attachments.length > 0) {
        const att = attachments[0];
        const isImage = att.type === "image";
        payload.type = isImage ? "image" : "document";
        payload[isImage ? "image" : "document"] = {
          link: att.url,
          caption: text,
        };
      } else {
        payload.type = "text";
        payload.text = {
          preview_url: false,
          body: text,
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("WhatsApp Cloud API Error response:", errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending WhatsApp Cloud API response:", error);
      return false;
    }
  }

  async sendTypingIndicator(recipientId: string, isTyping: boolean): Promise<void> {
    // WhatsApp Cloud API does not support a dedicated "typing" API endpoint for cloud bots,
    // but some partners/integrations simulate it. We leave it as a no-op placeholder here.
    return;
  }
}
