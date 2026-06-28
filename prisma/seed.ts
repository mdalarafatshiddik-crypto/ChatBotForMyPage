import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Clean existing records
  await prisma.auditLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.businessSettings.deleteMany();
  await prisma.businessMember.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      name: "Arafat Rahman",
      email: "admin@echosunnah.com",
      passwordHash: "$2b$10$xyz123mockhashhereforpasswordsecurity",
      role: "ADMIN",
    },
  });

  // 3. Create Business Tenant
  const business = await prisma.business.create({
    data: {
      name: "Echo Sunnah Hijama & Cupping Center",
      slug: "echo-sunnah",
      logoUrl: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=150&h=150&fit=crop",
      plan: "GROWTH",
    },
  });

  // 4. Link User to Business
  await prisma.businessMember.create({
    data: {
      businessId: business.id,
      userId: adminUser.id,
      role: "OWNER",
    },
  });

  // 5. Create Business Settings
  await prisma.businessSettings.create({
    data: {
      businessId: business.id,
      businessInfo: "Echo Sunnah Hijama & Cupping Center provides standard and premium cupping/hijama therapy services in Dhanmondi, Dhaka. Special care is taken for hygiene.",
      pricingDetails: "Hijama Therapy is 150 BDT per cup. Initial consultation is 500 BDT (waived if therapy is taken). Packages: 6 cups for 800 BDT, 10 cups for 1300 BDT.",
      address: "12/A, Dhanmondi, Dhaka, Bangladesh",
      phone: "+8801712345678",
      email: "info@echosunnah.com",
      openingHours: {
        saturday: "10:00 AM - 8:30 PM",
        sunday: "10:00 AM - 8:30 PM",
        monday: "10:00 AM - 8:30 PM",
        tuesday: "10:00 AM - 8:30 PM",
        wednesday: "10:00 AM - 8:30 PM",
        thursday: "10:00 AM - 8:30 PM",
        friday: "Closed",
      },
      defaultLanguage: "bn",
      activeModelProvider: "GEMINI",
      activeModelName: "gemini-1.5-flash",
    },
  });

  // 6. Create Prompt System
  const systemPrompt = await prisma.prompt.create({
    data: {
      businessId: business.id,
      name: "Professional Bangla Hijama Agent",
      isDefault: true,
      greetingText: "আসসালামু আলাইকুম! ইকো সুন্নাহ হিজামা সেন্টারে আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?",
      awayMessage: "আসসালামু আলাইকুম। আমাদের সেন্টার বর্তমানে বন্ধ আছে। আমাদের খোলার সময় শনি থেকে বৃহস্পতিবার সকাল ১০টা থেকে রাত ৮:৩০ পর্যন্ত। আপনার প্রশ্নটি লিখে রাখুন, আমরা খোলার সাথে সাথে উত্তর দেব।",
      systemPrompt: `You are the professional AI customer support agent for "Echo Sunnah Hijama & Cupping Center".
Reply professionally.
Reply in Bangla by default.
Reply in English only if the customer speaks or asks in English.
Only answer business related questions based on the knowledge base.
If unknown or outside scope, politely say a human agent will assist them shortly.
Never invent prices.
Never give a medical diagnosis or promise absolute cures. Always recommend consulting our certified therapist.`,
    },
  });

  // 7. Create Channels
  const messengerChannel = await prisma.channel.create({
    data: {
      businessId: business.id,
      type: "FACEBOOK_MESSENGER",
      name: "Echo Sunnah FB Page Messenger",
      providerId: "fb_page_123456",
      accessToken: "mock_fb_page_access_token_encrypted_string",
      webhookVerifyToken: "echosunnah_verify_secret_token",
      prompts: {
        connect: { id: systemPrompt.id },
      },
    },
  });

  const whatsappChannel = await prisma.channel.create({
    data: {
      businessId: business.id,
      type: "WHATSAPP_CLOUD",
      name: "+8801700000000 WhatsApp Business",
      providerId: "wa_phone_987654",
      accessToken: "mock_whatsapp_cloud_token_encrypted_string",
      prompts: {
        connect: { id: systemPrompt.id },
      },
    },
  });

  // 8. Create Customers (Omnichannel Profiles)
  const customer1 = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: "Kabir Hossain",
      email: "kabir@gmail.com",
      phone: "+8801812345678",
      facebookId: "fb_user_9988",
      whatsappId: "+8801812345678",
      language: "bn",
      tags: ["Regular", "Back Pain"],
      notes: "Customer complained about severe lower back pain. Advised 6-point hijama.",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: "Sarah Smith",
      email: "sarah.smith@yahoo.com",
      facebookId: "fb_user_7766",
      language: "en",
      tags: ["New Lead", "Inquiry"],
      notes: "Prefers English. Interested in face cupping for acne.",
    },
  });

  // 9. Create Conversations & Message Histories
  // Conversation 1 (AI Automated Response Mode)
  const conv1 = await prisma.conversation.create({
    data: {
      businessId: business.id,
      customerId: customer1.id,
      status: "AI",
      lastMessageAt: new Date(Date.now() - 3600000), // 1 hour ago
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        channelId: messengerChannel.id,
        customerId: customer1.id,
        senderType: "CUSTOMER",
        content: "হিজামা থেরাপির দাম কত?",
        createdAt: new Date(Date.now() - 3600 * 1000 - 300 * 1000),
      },
      {
        conversationId: conv1.id,
        senderType: "AI",
        content: "আসসালামু আলাইকুম! ইকো সুন্নাহ হিজামা সেন্টারে প্রতিটি কাপের জন্য খরচ ১৫০ টাকা। প্রাথমিক কনসালটেশন ফি ৫০০ টাকা, তবে থেরাপি নিলে কনসালটেশন ফি পুরোপুরি ফ্রি।",
        modelUsed: "gemini-1.5-flash",
        promptTokens: 412,
        completionTokens: 68,
        cost: 0.0001,
        createdAt: new Date(Date.now() - 3600 * 1000 - 280 * 1000),
      },
      {
        conversationId: conv1.id,
        channelId: messengerChannel.id,
        customerId: customer1.id,
        senderType: "CUSTOMER",
        content: "আপনারা কি শুক্রবারে খোলা থাকেন?",
        createdAt: new Date(Date.now() - 3600 * 1000),
      },
      {
        conversationId: conv1.id,
        senderType: "AI",
        content: "দুঃখিত, শুক্রবারে আমাদের সেন্টার বন্ধ থাকে। আমরা শনি থেকে বৃহস্পতিবার সকাল ১০:০০ টা থেকে রাত ৮:৩০ টা পর্যন্ত খোলা থাকি। আপনি কি অন্য কোন দিন আসতে চান?",
        modelUsed: "gemini-1.5-flash",
        promptTokens: 520,
        completionTokens: 52,
        cost: 0.00012,
        createdAt: new Date(Date.now() - 3600 * 1000 + 20 * 1000),
      },
    ],
  });

  // Conversation 2 (Human Agent Taken Over)
  const conv2 = await prisma.conversation.create({
    data: {
      businessId: business.id,
      customerId: customer2.id,
      status: "HUMAN",
      assignedAgentId: adminUser.id,
      unreadCount: 1,
      lastMessageAt: new Date(),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv2.id,
        channelId: messengerChannel.id,
        customerId: customer2.id,
        senderType: "CUSTOMER",
        content: "Hi, do you provide head cupping without shaving hair?",
        createdAt: new Date(Date.now() - 1800 * 1000),
      },
      {
        conversationId: conv2.id,
        senderType: "AI",
        content: "Hello! Thank you for reaching out. Yes, we provide hijama on the head without shaving the hair using special cupping devices. However, a human agent will connect with you shortly to explain the details and booking options.",
        modelUsed: "gemini-1.5-flash",
        promptTokens: 380,
        completionTokens: 75,
        cost: 0.00009,
        createdAt: new Date(Date.now() - 1780 * 1000),
      },
      {
        conversationId: conv2.id,
        channelId: messengerChannel.id,
        customerId: customer2.id,
        senderType: "CUSTOMER",
        content: "Great, please let me know the booking slot for next Monday.",
        createdAt: new Date(),
      },
    ],
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
