"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Bot,
  User,
  Clock,
  TrendingUp,
  Plus,
  Search,
  Send,
  FileText,
  CheckCheck,
  Globe,
  Activity,
  Paperclip,
  Settings,
  Shield,
  Phone,
  Database,
  BarChart3,
  Moon,
  Sun,
  X,
  PlusCircle,
  HelpCircle,
  Link as LinkIcon
} from "lucide-react";

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

// Mock Data representing the seeded database state for Kabir and Sarah
const initialConversations = [
  {
    id: "conv-1",
    customer: {
      name: "Kabir Hossain",
      phone: "+8801812345678",
      email: "kabir@gmail.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      tags: ["Regular", "Back Pain"],
      notes: "Customer complained about severe lower back pain. Advised 6-point hijama.",
      language: "Bengla",
      platform: "Messenger",
      platformIcon: FacebookIcon
    },
    status: "AI", // "AI" | "HUMAN" | "CLOSED"
    unreadCount: 0,
    pinned: true,
    lastMessageText: "দুঃখিত, শুক্রবারে আমাদের সেন্টার বন্ধ থাকে। আমরা শনি থেকে বৃহস্পতিবার...",
    lastMessageAt: "10:12 AM",
    messages: [
      { id: "m1", sender: "CUSTOMER", text: "হিজামা থেরাপির দাম কত?", time: "10:05 AM" },
      { id: "m2", sender: "AI", text: "আসসালামু আলাইকুম! ইকো সুন্নাহ হিজামা সেন্টারে প্রতিটি কাপের জন্য খরচ ১৫০ টাকা। প্রাথমিক কনসালটেশন ফি ৫০০ টাকা, তবে থেরাপি নিলে কনসালটেশন ফি পুরোপুরি ফ্রি।", time: "10:06 AM" },
      { id: "m3", sender: "CUSTOMER", text: "আপনারা কি শুক্রবারে খোলা থাকেন?", time: "10:10 AM" },
      { id: "m4", sender: "AI", text: "দুঃখিত, শুক্রবারে আমাদের সেন্টার বন্ধ থাকে। আমরা শনি থেকে বৃহস্পতিবার সকাল ১০:০০ টা থেকে রাত ৮:৩০ টা পর্যন্ত খোলা থাকি। আপনি কি অন্য কোন দিন আসতে চান?", time: "10:12 AM" }
    ]
  },
  {
    id: "conv-2",
    customer: {
      name: "Sarah Smith",
      phone: "+1 202 555 0143",
      email: "sarah.smith@yahoo.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      tags: ["New Lead", "Inquiry"],
      notes: "Prefers English. Interested in face cupping for acne.",
      language: "English",
      platform: "WhatsApp",
      platformIcon: Phone
    },
    status: "HUMAN",
    unreadCount: 1,
    pinned: false,
    lastMessageText: "Great, please let me know the booking slot for next Monday.",
    lastMessageAt: "11:45 AM",
    messages: [
      { id: "m5", sender: "CUSTOMER", text: "Hi, do you provide head cupping without shaving hair?", time: "11:30 AM" },
      { id: "m6", sender: "AI", text: "Hello! Thank you for reaching out. Yes, we provide hijama on the head without shaving the hair using special cupping devices. However, a human agent will connect with you shortly to explain the details and booking options.", time: "11:31 AM" },
      { id: "m7", sender: "CUSTOMER", text: "Great, please let me know the booking slot for next Monday.", time: "11:45 AM" }
    ]
  }
];

const initialKnowledgeDocs = [
  { id: "doc-1", name: "hijama-pricing-v2.pdf", type: "PDF", size: "1.2 MB", status: "COMPLETED", date: "Jun 24, 2026" },
  { id: "doc-2", name: "frequently-asked-questions.docx", type: "DOCX", size: "340 KB", status: "COMPLETED", date: "Jun 25, 2026" },
  { id: "doc-3", name: "Dhanmondi Center Directions.txt", type: "TXT", size: "12 KB", status: "COMPLETED", date: "Jun 26, 2026" },
  { id: "doc-4", name: "https://echosunnah.com/faq-list", type: "URL", size: "Scraped Page", status: "COMPLETED", date: "Jun 27, 2026" }
];

export default function Home() {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConvId, setActiveConvId] = useState("conv-1");
  const [activeTab, setActiveTab] = useState("inbox"); // "dashboard" | "inbox" | "knowledge" | "prompts" | "settings"
  const [inboxFilter, setInboxFilter] = useState("ALL"); // "ALL" | "AI" | "HUMAN" | "CLOSED"
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Prompt settings states
  const [activeModel, setActiveModel] = useState("GEMINI"); // GEMINI | OPENAI | CLAUDE
  const [systemPromptText, setSystemPromptText] = useState(
    `You are the professional AI customer support agent for "Echo Sunnah Hijama & Cupping Center".\nReply professionally.\nReply in Bangla by default.\nReply in English only if the customer speaks or asks in English.\nOnly answer business related questions based on the knowledge base.\nIf unknown or outside scope, politely say a human agent will assist them shortly.\nNever invent prices.\nNever give a medical diagnosis or promise absolute cures. Always recommend consulting our certified therapist.`
  );

  // Knowledge base states
  const [knowledgeDocs, setKnowledgeDocs] = useState(initialKnowledgeDocs);
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");
  const [newUrlLink, setNewUrlLink] = useState("");

  // Simulated AI response timeout
  const simulateAIResponse = (convId: string, userText: string) => {
    setTimeout(() => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === convId && c.status === "AI") {
            const aiReplyText = userText.toLowerCase().includes("hijama")
              ? "হিজামা বা কাপিং থেরাপি হলো একটি প্রাচীন চিকিৎসা পদ্ধতি যেখানে চামড়ার উপর ভ্যাকুয়াম কাপ বসিয়ে টক্সিন ও দূষিত রক্ত বের করা হয়। আমাদের সেন্টারে এটি অত্যন্ত স্বাস্থ্যসম্মত ও জীবাণুমুক্ত উপায়ে করা হয়।"
              : "আপনার প্রশ্নটির জন্য ধন্যবাদ। এই বিষয়ে আমাদের কাস্টমার প্রতিনিধি আপনাকে খুব শীঘ্রই মেসেজ দিয়ে বিস্তারিত তথ্য জানাবেন।";
            
            return {
              ...c,
              lastMessageText: aiReplyText,
              lastMessageAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              messages: [
                ...c.messages,
                {
                  id: `ai-${Date.now()}`,
                  sender: "AI",
                  text: aiReplyText,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ],
            };
          }
          return c;
        })
      );
    }, 2000);
  };

  // Send human message or simulate client message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const currentConv = conversations.find((c) => c.id === activeConvId);
    if (!currentConv) return;

    const newMessage = {
      id: `m-${Date.now()}`,
      sender: currentConv.status === "HUMAN" ? "USER" : "CUSTOMER", // Send as Agent if taken over, else simulate customer typing
      text: replyText,
      time: timeString,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          return {
            ...c,
            lastMessageText: replyText,
            lastMessageAt: timeString,
            unreadCount: 0,
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      })
    );

    const prevReplyText = replyText;
    setReplyText("");

    // If simulating customer and status is AI, trigger automatic AI reply after delay
    if (currentConv.status === "AI") {
      simulateAIResponse(activeConvId, prevReplyText);
    }
  };

  // Toggle Human Takeover mode
  const toggleTakeover = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          const nextStatus = c.status === "AI" ? "HUMAN" : "AI";
          return {
            ...c,
            status: nextStatus,
          };
        }
        return c;
      })
    );
  };

  // Add FAQ to Knowledge Base
  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;

    const newDoc = {
      id: `faq-${Date.now()}`,
      name: `FAQ: ${newFaqQuestion.slice(0, 30)}...`,
      type: "FAQ",
      size: "Custom Entry",
      status: "COMPLETED",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    setKnowledgeDocs([newDoc, ...knowledgeDocs]);
    setNewFaqQuestion("");
    setNewFaqAnswer("");
  };

  // Add URL to Knowledge Base
  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrlLink.trim()) return;

    const newDoc = {
      id: `url-${Date.now()}`,
      name: newUrlLink,
      type: "URL",
      size: "Scraping Link",
      status: "COMPLETED",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    setKnowledgeDocs([newDoc, ...knowledgeDocs]);
    setNewUrlLink("");
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.customer.phone.includes(searchQuery);
    if (!matchesSearch) return false;

    if (inboxFilter === "ALL") return true;
    return c.status === inboxFilter;
  });

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isDarkMode ? "bg-[#0b0f19] text-[#e2e8f0]" : "bg-slate-50 text-slate-800"}`}>
      
      {/* 1. Global Navigation Bar (Header) */}
      <header className={`sticky top-0 z-40 border-b flex items-center justify-between px-6 py-3.5 backdrop-blur-md ${isDarkMode ? "bg-[#0f172a]/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">OmniSupport AI</h1>
            <p className="text-xs text-indigo-400 font-medium">Echo Sunnah Hijama Dashboard</p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-800/10 p-1.5 rounded-lg border border-slate-700/20">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === "dashboard"
                ? isDarkMode
                  ? "bg-slate-800 text-white shadow"
                  : "bg-white text-slate-900 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Analytics Dashboard
          </button>
          <button
            onClick={() => setActiveTab("inbox")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === "inbox"
                ? isDarkMode
                  ? "bg-slate-800 text-white shadow"
                  : "bg-white text-slate-900 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Unified Live Inbox
          </button>
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === "knowledge"
                ? isDarkMode
                  ? "bg-slate-800 text-white shadow"
                  : "bg-white text-slate-900 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="h-4 w-4 inline mr-2" />
            Knowledge Base (RAG)
          </button>
          <button
            onClick={() => setActiveTab("prompts")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === "prompts"
                ? isDarkMode
                  ? "bg-slate-800 text-white shadow"
                  : "bg-white text-slate-900 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            AI Prompts
          </button>
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg border transition-colors ${
              isDarkMode ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-2 border-l border-slate-700/30 pl-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-400">AI Active</span>
          </div>
        </div>
      </header>

      {/* 2. Page Content Body */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* ==================== TAB 1: ANALYTICS DASHBOARD ==================== */}
        {activeTab === "dashboard" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"}`}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Conversations</p>
                <h3 className="text-2xl font-bold mt-1">3,420</h3>
                <span className="text-xs text-emerald-400 font-medium">↑ 12% this week</span>
              </div>
              <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"}`}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Messages</p>
                <h3 className="text-2xl font-bold mt-1">184,203</h3>
                <span className="text-xs text-emerald-400 font-medium">↑ 8% this week</span>
              </div>
              <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"}`}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Accuracy Rate</p>
                <h3 className="text-2xl font-bold mt-1 text-indigo-400">94.2%</h3>
                <span className="text-xs text-indigo-400 font-medium">Standard safety threshold</span>
              </div>
              <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"}`}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Response Time</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-400">1.2s</h3>
                <span className="text-xs text-slate-400 font-medium">Instant AI Replies</span>
              </div>
              <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"}`}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Cost Saved</p>
                <h3 className="text-2xl font-bold mt-1 text-indigo-400">$245.50</h3>
                <span className="text-xs text-indigo-400 font-medium">Using Gemini Flash</span>
              </div>
            </div>

            {/* Core Channels Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-5 rounded-xl border col-span-2 ${isDarkMode ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-sm uppercase text-slate-400 tracking-wider">Messages per Day</h4>
                  <div className="flex gap-4 text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-indigo-500 rounded-full inline-block"></span> AI Responses</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-violet-600 rounded-full inline-block"></span> Human Agent</span>
                  </div>
                </div>
                {/* SVG Line Chart representing messaging rates */}
                <div className="h-64 flex items-end justify-between gap-2 border-b border-l border-slate-800 pb-2 pl-2">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full flex gap-1 items-end justify-center h-48">
                      <div className="bg-indigo-500 w-3 rounded-t" style={{ height: "45%" }}></div>
                      <div className="bg-violet-600 w-3 rounded-t" style={{ height: "15%" }}></div>
                    </div>
                    <span className="text-xs text-slate-500 mt-2 font-medium">Mon</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full flex gap-1 items-end justify-center h-48">
                      <div className="bg-indigo-500 w-3 rounded-t" style={{ height: "55%" }}></div>
                      <div className="bg-violet-600 w-3 rounded-t" style={{ height: "20%" }}></div>
                    </div>
                    <span className="text-xs text-slate-500 mt-2 font-medium">Tue</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full flex gap-1 items-end justify-center h-48">
                      <div className="bg-indigo-500 w-3 rounded-t" style={{ height: "70%" }}></div>
                      <div className="bg-violet-600 w-3 rounded-t" style={{ height: "10%" }}></div>
                    </div>
                    <span className="text-xs text-slate-500 mt-2 font-medium">Wed</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full flex gap-1 items-end justify-center h-48">
                      <div className="bg-indigo-500 w-3 rounded-t" style={{ height: "65%" }}></div>
                      <div className="bg-violet-600 w-3 rounded-t" style={{ height: "12%" }}></div>
                    </div>
                    <span className="text-xs text-slate-500 mt-2 font-medium">Thu</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full flex gap-1 items-end justify-center h-48">
                      <div className="bg-indigo-500 w-3 rounded-t" style={{ height: "80%" }}></div>
                      <div className="bg-violet-600 w-3 rounded-t" style={{ height: "8%" }}></div>
                    </div>
                    <span className="text-xs text-slate-500 mt-2 font-medium">Fri</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full flex gap-1 items-end justify-center h-48">
                      <div className="bg-indigo-500 w-3 rounded-t" style={{ height: "90%" }}></div>
                      <div className="bg-violet-600 w-3 rounded-t" style={{ height: "5%" }}></div>
                    </div>
                    <span className="text-xs text-slate-500 mt-2 font-medium">Sat</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full flex gap-1 items-end justify-center h-48">
                      <div className="bg-indigo-500 w-3 rounded-t" style={{ height: "85%" }}></div>
                      <div className="bg-violet-600 w-3 rounded-t" style={{ height: "10%" }}></div>
                    </div>
                    <span className="text-xs text-slate-500 mt-2 font-medium">Sun</span>
                  </div>
                </div>
              </div>

              {/* Omnichannel Distribution */}
              <div className={`p-5 rounded-xl border ${isDarkMode ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"}`}>
                <h4 className="font-bold text-sm uppercase text-slate-400 tracking-wider mb-6">Channel Traffic Distribution</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Facebook Messenger</span>
                      <span>52%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: "52%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>WhatsApp Cloud API</span>
                      <span>35%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: "35%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Website Live Chat Widget</span>
                      <span>13%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: "13%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-800 pt-6">
                  <h5 className="font-bold text-xs uppercase text-slate-400 mb-4">Top User Inquiries (Keywords)</h5>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700">হিজামা কি? (642)</span>
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700">থেরাপির দাম (510)</span>
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700">Dhanmondi Location (340)</span>
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700">Appointment (290)</span>
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700">Acne Cupping (120)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Connected integrations */}
            <div className={`p-6 rounded-xl border ${isDarkMode ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"}`}>
              <h4 className="font-bold text-sm uppercase text-slate-400 tracking-wider mb-4">Meta Channel Access Points</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600/20 p-2.5 rounded-lg text-blue-500">
                      <FacebookIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm">Echo Sunnah FB Page Messenger</h5>
                      <p className="text-xs text-slate-500">Page ID: fb_page_123456 • Active Webhook</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs rounded-md font-semibold">Connected</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-600/20 p-2.5 rounded-lg text-emerald-500">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm">+8801700000000 WhatsApp Business</h5>
                      <p className="text-xs text-slate-500">Phone ID: wa_phone_987654 • Verified</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs rounded-md font-semibold">Connected</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 2: UNIFIED LIVE INBOX ==================== */}
        {activeTab === "inbox" && (
          <div className="flex-1 flex overflow-hidden">
            
            {/* INBOX LEFT SIDEBAR (CONVERSATION LIST) */}
            <aside className={`w-80 border-r flex flex-col ${isDarkMode ? "bg-[#0f172a]/50 border-slate-800" : "bg-white border-slate-200"}`}>
              {/* Sidebar Header Filters */}
              <div className="p-4 space-y-3 border-b border-slate-800/60">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search name/number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
                  {["ALL", "AI", "HUMAN", "CLOSED"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setInboxFilter(f)}
                      className={`flex-1 text-[10px] py-1 rounded font-semibold uppercase tracking-wider transition-all ${
                        inboxFilter === f
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversations Feed Scroll Container */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
                {filteredConversations.map((c) => {
                  const PlatformIcon = c.customer.platformIcon;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveConvId(c.id)}
                      className={`p-4 cursor-pointer transition-all border-l-2 flex gap-3 ${
                        activeConvId === c.id
                          ? isDarkMode
                            ? "bg-slate-800/35 border-indigo-500"
                            : "bg-slate-100 border-indigo-500"
                          : "border-transparent hover:bg-slate-800/10"
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={c.customer.avatar}
                          alt={c.customer.name}
                          className="h-10 w-10 rounded-full object-cover border border-slate-800"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-slate-900 p-0.5 rounded-full">
                          <PlatformIcon className="h-3.5 w-3.5 text-indigo-400" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h5 className="font-semibold text-xs truncate">{c.customer.name}</h5>
                          <span className="text-[9px] text-slate-500">{c.lastMessageAt}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mb-1.5">{c.lastMessageText}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1.5">
                            {c.status === "AI" ? (
                              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] rounded font-bold uppercase tracking-wider flex items-center gap-1">
                                <Bot className="h-2.5 w-2.5" /> AI
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] rounded font-bold uppercase tracking-wider flex items-center gap-1">
                                <User className="h-2.5 w-2.5" /> Human
                              </span>
                            )}
                          </div>
                          {c.unreadCount > 0 && (
                            <span className="h-4 min-w-4 bg-indigo-600 rounded-full flex items-center justify-center text-[9px] text-white px-1 font-bold">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* CHAT CHRONOLOGY (TIMELINE WINDOW) */}
            <section className="flex-1 flex flex-col bg-slate-950/20">
              {activeConv ? (
                <>
                  {/* Chat Window Header */}
                  <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-800 bg-[#0f172a]/30" : "bg-white border-slate-200"}`}>
                    <div className="flex items-center gap-3">
                      <img
                        src={activeConv.customer.avatar}
                        alt={activeConv.customer.name}
                        className="h-10 w-10 rounded-full object-cover border border-slate-800"
                      />
                      <div>
                        <h4 className="font-bold text-xs">{activeConv.customer.name}</h4>
                        <p className="text-[10px] text-slate-500">
                          via {activeConv.customer.platform} • {activeConv.customer.phone}
                        </p>
                      </div>
                    </div>

                    {/* AI Autonomous Auto-reply Switcher */}
                    <div className="flex items-center gap-3 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Bot className="h-3 w-3 text-indigo-400" /> AI Bot Auto-reply
                      </span>
                      <button
                        onClick={() => toggleTakeover(activeConv.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${
                          activeConv.status === "AI" ? "bg-indigo-600" : "bg-slate-800"
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all duration-300 ${
                            activeConv.status === "AI" ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${activeConv.status === "AI" ? "text-indigo-400" : "text-rose-400"}`}>
                        {activeConv.status === "AI" ? "Enabled" : "Takeover Active"}
                      </span>
                    </div>
                  </div>

                  {/* Messages Stream Container */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/10">
                    <div className="text-center">
                      <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-500 font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Conversation started on {activeConv.customer.platform}
                      </span>
                    </div>

                    {activeConv.messages.map((m) => {
                      const isCustomer = m.sender === "CUSTOMER";
                      const isAI = m.sender === "AI";
                      return (
                        <div
                          key={m.id}
                          className={`flex ${isCustomer ? "justify-start" : "justify-end"} items-end gap-2`}
                        >
                          {isCustomer && (
                            <img
                              src={activeConv.customer.avatar}
                              alt="Avatar"
                              className="h-6 w-6 rounded-full object-cover border border-slate-800"
                            />
                          )}
                          <div className="max-w-md">
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              {!isCustomer && (
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${isAI ? "text-indigo-400" : "text-rose-400"}`}>
                                  {isAI ? "AI Autoreply" : "Agent Arafat"}
                                </span>
                              )}
                              <span className="text-[9px] text-slate-500">{m.time}</span>
                            </div>
                            <div
                              className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                                isCustomer
                                  ? isDarkMode
                                    ? "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                                    : "bg-slate-200 text-slate-900 rounded-bl-none"
                                  : isAI
                                  ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-none"
                                  : "bg-slate-800 text-white rounded-br-none"
                              }`}
                            >
                              {m.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Simulating typing indicator */}
                    {activeConv.status === "AI" && activeConv.messages[activeConv.messages.length - 1].sender === "CUSTOMER" && (
                      <div className="flex justify-start items-center gap-2">
                        <img
                          src={activeConv.customer.avatar}
                          alt="Avatar"
                          className="h-6 w-6 rounded-full object-cover border border-slate-800"
                        />
                        <div className="bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-2xl rounded-bl-none flex gap-1 items-center">
                          <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                          <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input form panel */}
                  <form onSubmit={handleSendMessage} className={`p-4 border-t ${isDarkMode ? "border-slate-800 bg-[#0f172a]/20" : "bg-white border-slate-200"}`}>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={`p-2.5 rounded-lg border transition-colors ${
                          isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>
                      <input
                        type="text"
                        placeholder={
                          activeConv.status === "AI"
                            ? "Type to simulate customer sending a message..."
                            : "Type response as human agent..."
                        }
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
                      >
                        Send <Send className="h-3 w-3" />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                  <MessageSquare className="h-12 w-12 text-slate-700 mb-2" />
                  <p className="text-sm">Select a conversation to start messaging</p>
                </div>
              )}
            </section>

            {/* RIGHT SIDEBAR (CRM CUSTOMER PROFILE CARD) */}
            {activeConv && (
              <aside className={`w-80 border-l flex flex-col p-5 space-y-6 ${isDarkMode ? "bg-[#0f172a]/40 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex flex-col items-center text-center">
                  <img
                    src={activeConv.customer.avatar}
                    alt={activeConv.customer.name}
                    className="h-16 w-16 rounded-full object-cover border border-slate-800 mb-3"
                  />
                  <h4 className="font-bold text-sm">{activeConv.customer.name}</h4>
                  <span className="text-[10px] text-indigo-400 font-semibold mt-1">Identified Lead</span>
                </div>

                <div className="space-y-4 text-xs border-t border-b border-slate-800/60 py-4">
                  <h5 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">Customer Profile CRM</h5>
                  <div className="space-y-2">
                    <p className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium">{activeConv.customer.email}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-medium">{activeConv.customer.phone}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Language:</span>
                      <span className="font-medium">{activeConv.customer.language}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">Segment Tags</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {activeConv.customer.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 text-[10px] rounded font-semibold"
                      >
                        {t}
                      </span>
                    ))}
                    <button className="px-2 py-0.5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 text-[10px] rounded font-bold hover:bg-indigo-600/20">
                      + Add
                    </button>
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">Agent Notes</h5>
                  <textarea
                    readOnly
                    value={activeConv.customer.notes}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 min-h-24 resize-none"
                  />
                </div>
              </aside>
            )}
          </div>
        )}

        {/* ==================== TAB 3: KNOWLEDGE BASE (RAG) ==================== */}
        {activeTab === "knowledge" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Upload Panel */}
              <div className={`p-5 rounded-xl border space-y-4 ${isDarkMode ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"}`}>
                <h4 className="font-bold text-sm uppercase text-slate-400 tracking-wider">Feed Knowledge Source (RAG)</h4>
                
                {/* PDF/DOCX Uploader Mock */}
                <div className="border-2 border-dashed border-slate-800 rounded-lg p-6 text-center space-y-2 hover:border-indigo-500 transition-colors cursor-pointer bg-slate-950/20">
                  <FileText className="h-8 w-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">Upload PDF, DOCX, or TXT file</p>
                  <p className="text-[10px] text-slate-500">Files up to 10MB will be chunked and vectorized</p>
                </div>

                <div className="border-t border-slate-800/80 pt-4 space-y-3">
                  <h5 className="font-semibold text-xs">Add Website URL to Scrape</h5>
                  <form onSubmit={handleAddUrl} className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/services"
                      value={newUrlLink}
                      onChange={(e) => setNewUrlLink(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 rounded-lg"
                    >
                      Scrape
                    </button>
                  </form>
                </div>

                <div className="border-t border-slate-800/80 pt-4 space-y-3">
                  <h5 className="font-semibold text-xs">Add FAQ Item</h5>
                  <form onSubmit={handleAddFaq} className="space-y-2">
                    <input
                      type="text"
                      placeholder="Question: e.g. What is hijama?"
                      value={newFaqQuestion}
                      onChange={(e) => setNewFaqQuestion(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <textarea
                      placeholder="Answer: e.g. Hijama is an ancient..."
                      value={newFaqAnswer}
                      onChange={(e) => setNewFaqAnswer(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500 min-h-16 resize-none"
                    />
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 rounded-lg"
                    >
                      Add FAQ to Knowledge Base
                    </button>
                  </form>
                </div>
              </div>

              {/* Vector Document Registry */}
              <div className={`p-5 rounded-xl border col-span-2 space-y-4 ${isDarkMode ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"}`}>
                <h4 className="font-bold text-sm uppercase text-slate-400 tracking-wider">Vectorized Document Registry</h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                        <th className="pb-3">Source Name</th>
                        <th className="pb-3">Format</th>
                        <th className="pb-3">Data Size</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Added Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {knowledgeDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-800/10">
                          <td className="py-3.5 font-semibold text-slate-200 flex items-center gap-2">
                            {doc.type === "URL" ? <LinkIcon className="h-3.5 w-3.5 text-indigo-400" /> : <FileText className="h-3.5 w-3.5 text-emerald-400" />}
                            <span className="truncate max-w-xs">{doc.name}</span>
                          </td>
                          <td className="py-3.5">{doc.type}</td>
                          <td className="py-3.5">{doc.size}</td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[10px]">
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500">{doc.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================== TAB 4: SYSTEM PROMPTS ==================== */}
        {activeTab === "prompts" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Settings Card */}
              <div className={`p-5 rounded-xl border space-y-6 ${isDarkMode ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"}`}>
                <div>
                  <h4 className="font-bold text-sm uppercase text-slate-400 tracking-wider mb-4">Prompt Configuration</h4>
                  
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Assign Prompt Scope</label>
                      <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500">
                        <option>Global (All Connected Channels)</option>
                        <option>Specific Facebook Page</option>
                        <option>Specific WhatsApp Number</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Active AI Provider Model</label>
                      <select
                        value={activeModel}
                        onChange={(e) => setActiveModel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="GEMINI">Gemini 1.5 Flash (Default)</option>
                        <option value="GEMINI-PRO">Gemini 1.5 Pro</option>
                        <option value="OPENAI">GPT-4o (OpenAI)</option>
                        <option value="CLAUDE">Claude 3.5 Sonnet</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Default Response Language</label>
                      <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500">
                        <option value="bn">Bangla (default)</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-6">
                  <h5 className="font-bold text-xs uppercase text-slate-400 mb-4">Automated Greetings</h5>
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Greeting Text</label>
                      <textarea
                        defaultValue="আসসালামু আলাইকুম! ইকো সুন্নাহ হিজামা সেন্টারে আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:outline-none focus:border-indigo-500 min-h-16 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Away Message (Office Hours Closed)</label>
                      <textarea
                        defaultValue="আসসালামু আলাইকুম। আমাদের সেন্টার বর্তমানে বন্ধ আছে। আপনার প্রশ্নটি লিখে রাখুন, আমরা খোলার সাথে সাথে উত্তর দেব।"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:outline-none focus:border-indigo-500 min-h-16 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor Workspace */}
              <div className={`p-5 rounded-xl border col-span-2 flex flex-col space-y-4 ${isDarkMode ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm uppercase text-slate-400 tracking-wider">System Prompt Editor</h4>
                  <span className="text-[10px] text-indigo-400 font-semibold">Loaded template: Professional Hijama Agent</span>
                </div>

                <textarea
                  value={systemPromptText}
                  onChange={(e) => setSystemPromptText(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs font-mono focus:outline-none focus:border-indigo-500 min-h-96 resize-none leading-relaxed text-slate-300"
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setSystemPromptText(initialConversations[0].messages[0].text)} // mock reset
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-900 rounded-lg text-xs font-semibold"
                  >
                    Reset Defaults
                  </button>
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20">
                    Save System Prompt
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
