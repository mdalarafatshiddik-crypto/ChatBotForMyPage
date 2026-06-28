import { NextRequest, NextResponse } from "next/server";
import { routeIncomingMessage } from "@/lib/ai/router";
import { db } from "@/lib/db";

/**
 * Meta WhatsApp Webhook verification (GET request)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe") {
      // Find matching verify token in channels
      const channel = await db.channel.findFirst({
        where: {
          webhookVerifyToken: token,
          type: "WHATSAPP_CLOUD",
        },
      });

      const systemVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "echosunnah_verify_secret_token";

      if (channel || token === systemVerifyToken) {
        console.log("WhatsApp Webhook verified successfully.");
        return new NextResponse(challenge, { status: 200 });
      }
    }
    console.error("WhatsApp Webhook verification failed. Token mismatch.");
    return new NextResponse("Forbidden", { status: 403 });
  }

  return new NextResponse("Bad Request", { status: 400 });
}

/**
 * Receive WhatsApp Cloud API webhooks (POST request)
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    console.log("Received WhatsApp Webhook payload:", JSON.stringify(payload, null, 2));

    if (payload.entry) {
      for (const entry of payload.entry) {
        if (!entry.changes) continue;

        for (const change of entry.changes) {
          const value = change.value;
          if (!value || !value.messages) continue;

          const phoneId = value.metadata?.phone_number_id;

          for (const message of value.messages) {
            if (message.type === "text" && message.text) {
              const senderPhone = message.from; // Customer's phone number
              const text = message.text.body;

              // Process asynchronously to respond 200 OK immediately
              routeIncomingMessage({
                channelProviderId: phoneId,
                channelType: "WHATSAPP_CLOUD",
                externalSenderId: senderPhone,
                messageText: text,
              }).catch((err) => {
                console.error("Error routing WhatsApp message:", err);
              });
            }
          }
        }
      }

      return NextResponse.json({ status: "success" }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid webhook format" }, { status: 400 });
  } catch (error) {
    console.error("WhatsApp Webhook POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
