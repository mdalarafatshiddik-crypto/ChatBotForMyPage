import { db } from "../db";
import { generateChatResponse } from "./llm-client";
import { retrieveRelevantContext } from "./rag";
import { FacebookConnector } from "../../connectors/facebook";
import { WhatsAppConnector } from "../../connectors/whatsapp";

interface RouteIncomingMessageArgs {
  channelProviderId: string; // e.g. Facebook Page ID or WhatsApp Phone Number ID
  channelType: "FACEBOOK_MESSENGER" | "WHATSAPP_CLOUD" | "TELEGRAM" | "WEBSITE_CHAT";
  externalSenderId: string;  // Customer ID on that channel (Page-scoped ID or phone)
  messageText: string;
  attachments?: any;
}

export async function routeIncomingMessage(args: RouteIncomingMessageArgs): Promise<boolean> {
  const { channelProviderId, channelType, externalSenderId, messageText, attachments } = args;

  try {
    // 1. Identify Channel & Business
    const channel = await db.channel.findFirst({
      where: {
        providerId: channelProviderId,
        type: channelType as any,
        isActive: true,
      },
      include: {
        business: {
          include: {
            settings: true,
            prompts: {
              where: { isDefault: true },
            },
          },
        },
      },
    });

    if (!channel) {
      console.error(`No active channel found for provider ID ${channelProviderId} and type ${channelType}`);
      return false;
    }

    const business = channel.business;
    const businessSettings = business.settings;
    const activePrompt = business.prompts[0];

    // 2. Identify/Create Customer in Tenant scope
    let customer = await db.customer.findFirst({
      where: {
        businessId: business.id,
        OR: [
          { facebookId: channelType === "FACEBOOK_MESSENGER" ? externalSenderId : undefined },
          { whatsappId: channelType === "WHATSAPP_CLOUD" ? externalSenderId : undefined },
          { phone: channelType === "WHATSAPP_CLOUD" ? externalSenderId : undefined },
        ],
      },
    });

    if (!customer) {
      customer = await db.customer.create({
        data: {
          businessId: business.id,
          name: channelType === "WHATSAPP_CLOUD" ? `WhatsApp User ${externalSenderId.slice(-4)}` : `User ${externalSenderId.slice(-4)}`,
          facebookId: channelType === "FACEBOOK_MESSENGER" ? externalSenderId : null,
          whatsappId: channelType === "WHATSAPP_CLOUD" ? externalSenderId : null,
          phone: channelType === "WHATSAPP_CLOUD" ? externalSenderId : null,
        },
      });
    }

    // 3. Load/Create Conversation
    let conversation = await db.conversation.findFirst({
      where: {
        businessId: business.id,
        customerId: customer.id,
      },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          status: "AI", // Default to AI auto-reply
        },
      });
    }

    // 4. Save incoming message record
    await db.message.create({
      data: {
        conversationId: conversation.id,
        channelId: channel.id,
        customerId: customer.id,
        senderType: "CUSTOMER",
        content: messageText,
        attachments: attachments ? (attachments as any) : undefined,
      },
    });

    // 5. If status is HUMAN (Takeover Active), do NOT auto-reply. Save message and return.
    if (conversation.status === "HUMAN") {
      // Update unread count for agents to see
      await db.conversation.update({
        where: { id: conversation.id },
        data: {
          unreadCount: { increment: 1 },
          lastMessageAt: new Date(),
        },
      });
      
      // Emit socket event here in real-time (notified via browser)
      console.log(`Agent takeover active. Forwarded customer message to unified inbox.`);
      return true;
    }

    // 6. RAG Context Retrieval
    const ragContext = await retrieveRelevantContext(
      business.id,
      messageText,
      businessSettings?.activeModelProvider || "GEMINI",
      channel.accessToken || undefined
    );

    // 7. Load Conversation History (last 10 messages)
    const recentMessages = await db.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    
    // Sort chronological
    recentMessages.reverse();

    const formattedHistory = recentMessages.map((msg) => ({
      role: msg.senderType === "CUSTOMER" ? ("user" as const) : ("model" as const),
      content: msg.content,
    }));

    // 8. Construct Dynamic Prompt
    const systemPromptBase = activePrompt?.systemPrompt || `You are a professional customer support agent for ${business.name}.
    Reply politely and concisely. If you do not know the answer, state that a human agent will assist shortly.`;

    const fullSystemInstruction = `${systemPromptBase}

---
KNOWLEDGE BASE DETAILS (RAG):
Use the following validated details to answer the user's questions:
${ragContext}
---

Follow these guardrails:
1. Speak in ${businessSettings?.defaultLanguage === "bn" ? "Bangla" : "English"} by default.
2. Only answer business-related questions.
3. If the answer is unknown, say a human agent will follow up soon.
4. Never invent prices or make medical diagnoses.`;

    // 9. Generate AI Response
    console.log(`Generating AI response via ${businessSettings?.activeModelProvider || "GEMINI"} (${businessSettings?.activeModelName || "gemini-1.5-flash"})`);
    
    // Trigger typing indicator on page channel
    if (channelType === "FACEBOOK_MESSENGER" && channel.accessToken) {
      const fbConnector = new FacebookConnector({
        accessToken: channel.accessToken,
        providerId: channel.providerId,
      });
      await fbConnector.sendTypingIndicator(externalSenderId, true);
    }

    const aiResponse = await generateChatResponse({
      provider: businessSettings?.activeModelProvider || "GEMINI",
      model: businessSettings?.activeModelName || "gemini-1.5-flash",
      systemInstruction: fullSystemInstruction,
      history: formattedHistory,
      prompt: messageText,
      // API Key fallback to server environment
    });

    // Disable typing indicator
    if (channelType === "FACEBOOK_MESSENGER" && channel.accessToken) {
      const fbConnector = new FacebookConnector({
        accessToken: channel.accessToken,
        providerId: channel.providerId,
      });
      await fbConnector.sendTypingIndicator(externalSenderId, false);
    }

    // 10. Send reply back to customer via the correct Channel Connector
    let sentSuccessfully = false;
    if (channelType === "FACEBOOK_MESSENGER" && channel.accessToken) {
      const fbConnector = new FacebookConnector({
        accessToken: channel.accessToken,
        providerId: channel.providerId,
      });
      sentSuccessfully = await fbConnector.sendMessage(externalSenderId, aiResponse.text);
    } else if (channelType === "WHATSAPP_CLOUD" && channel.accessToken) {
      const waConnector = new WhatsAppConnector({
        accessToken: channel.accessToken,
        providerId: channel.providerId,
      });
      sentSuccessfully = await waConnector.sendMessage(externalSenderId, aiResponse.text);
    } else {
      // Stub for other channels (Website Chat, Telegram etc.)
      console.log(`Sending response to website-widget/telegram client: ${aiResponse.text}`);
      sentSuccessfully = true;
    }

    if (sentSuccessfully) {
      // 11. Save AI Reply in Database & Update Conversation timestamps
      await db.$transaction([
        db.message.create({
          data: {
            conversationId: conversation.id,
            senderType: "AI",
            content: aiResponse.text,
            modelUsed: businessSettings?.activeModelName || "gemini-1.5-flash",
            promptTokens: aiResponse.usage.promptTokens,
            completionTokens: aiResponse.usage.completionTokens,
          },
        }),
        db.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
          },
        }),
      ]);
    }

    return sentSuccessfully;
  } catch (error) {
    console.error("AI Routing Pipeline Error:", error);
    return false;
  }
}
