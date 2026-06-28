import { BaseConnector, UnifiedMessage } from "./base-connector";

export class FacebookConnector extends BaseConnector {
  channelType = "FACEBOOK_MESSENGER";

  parseWebhook(payload: any): UnifiedMessage[] {
    const messages: UnifiedMessage[] = [];

    if (payload.object !== "page" || !payload.entry) {
      return messages;
    }

    for (const entry of payload.entry) {
      if (!entry.messaging) continue;

      for (const event of entry.messaging) {
        if (event.message) {
          const unifiedMsg: UnifiedMessage = {
            externalMessageId: event.message.mid,
            senderExternalId: event.sender.id,
            recipientExternalId: event.recipient.id,
            text: event.message.text,
            timestamp: new Date(event.timestamp),
          };

          if (event.message.attachments) {
            unifiedMsg.attachments = event.message.attachments.map((att: any) => ({
              type: att.type, // 'image', 'video', 'file', 'audio'
              url: att.payload.url,
            }));
          }

          messages.push(unifiedMsg);
        }
      }
    }

    return messages;
  }

  async sendMessage(recipientId: string, text: string, attachments?: any[]): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${this.accessToken}`;
      
      const payload: any = {
        recipient: { id: recipientId },
        message: {},
      };

      if (attachments && attachments.length > 0) {
        // Send attachment
        const att = attachments[0];
        payload.message = {
          attachment: {
            type: att.type,
            payload: {
              url: att.url,
              is_reusable: true,
            },
          },
        };
      } else {
        // Send text
        payload.message = { text };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Facebook API Error response:", errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending Facebook Messenger response:", error);
      return false;
    }
  }

  async sendTypingIndicator(recipientId: string, isTyping: boolean): Promise<void> {
    try {
      const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${this.accessToken}`;
      const payload = {
        recipient: { id: recipientId },
        sender_action: isTyping ? "typing_on" : "typing_off",
      };

      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Error setting Facebook typing indicator:", error);
    }
  }
}
