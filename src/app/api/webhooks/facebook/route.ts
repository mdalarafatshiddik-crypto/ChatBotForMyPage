import { NextRequest, NextResponse } from "next/server";
import { routeIncomingMessage } from "@/lib/ai/router";
import { db } from "@/lib/db";

/**
 * Meta Webhook verification (GET request)
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
          type: "FACEBOOK_MESSENGER",
        },
      });

      // Fallback to environment variable for initial setup/testing
      const systemVerifyToken = process.env.FACEBOOK_VERIFY_TOKEN || "echosunnah_verify_secret_token";

      if (channel || token === systemVerifyToken) {
        console.log("Facebook Webhook verified successfully.");
        return new NextResponse(challenge, { status: 200 });
      }
    }
    console.error("Facebook Webhook verification failed. Token mismatch.");
    return new NextResponse("Forbidden", { status: 403 });
  }

  return new NextResponse("Bad Request", { status: 400 });
}

/**
 * Receive Facebook Messenger webhooks (POST request)
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Log incoming payload for debugging
    console.log("Received Facebook Webhook payload:", JSON.stringify(payload, null, 2));

    if (payload.object === "page" && payload.entry) {
      for (const entry of payload.entry) {
        if (!entry.messaging) continue;

        for (const event of entry.messaging) {
          if (event.message && event.message.text) {
            const pageId = event.recipient.id; // The Facebook Page ID
            const senderId = event.sender.id; // Page Scoped User ID (PSID)
            const text = event.message.text;

            // Route asynchronously to avoid webhook timeouts (Meta expects 200 response within 3s)
            routeIncomingMessage({
              channelProviderId: pageId,
              channelType: "FACEBOOK_MESSENGER",
              externalSenderId: senderId,
              messageText: text,
              attachments: event.message.attachments || null,
            }).catch((err) => {
              console.error("Error in routed message execution:", err);
            });
          }
        }
      }

      return NextResponse.json({ status: "success" }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid webhook format" }, { status: 400 });
  } catch (error) {
    console.error("Facebook Webhook POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
