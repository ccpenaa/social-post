/**
 * Centralized configuration for the AI Social Post Generator application.
 */

const SOCIAL_PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", emoji: "💼", color: "bg-[#0a66c2]" },
  { id: "twitter", name: "Twitter / X", emoji: "🐦", color: "bg-black" },
  { id: "facebook", name: "Facebook", emoji: "👥", color: "bg-[#1877f2]" },
  { id: "instagram", name: "Instagram", emoji: "📸", color: "bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" },
];

const SOCIAL_TONES = [
  { id: "professional", name: "Professional", emoji: "💼", promptPart: "expertly polished, business-oriented, authoritative, and corporate tone" },
  { id: "casual", name: "Casual", emoji: "☕", promptPart: "friendly, conversational, approachable, and warm tone" },
  { id: "inspirational", name: "Inspirational", emoji: "🚀", promptPart: "uplifting, motivating, thought-provoking, and high-energy tone" },
  { id: "humorous", name: "Humorous", emoji: "🎭", promptPart: "witty, entertaining, clever, funny, and light-hearted tone" },
  { id: "bold", name: "Bold", emoji: "🔥", promptPart: "strong, assertive, disruptive, highly engaging, and confident tone" },
];

const config = {
  auth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    webhook_url: process.env.WEBHOOK_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
  },
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    plans: {
      basic: {
        id: "basic",
        name: "Basic Pack",
        credits: 1000,
        price: 500,
        description: "1,000 Credits — generate up to 250 high-engagement posts.",
      },
      standard: {
        id: "standard",
        name: "Standard Pack",
        credits: 2000,
        price: 1000,
        description: "2,000 Credits — generate up to 500 high-engagement posts.",
      },
      pro: {
        id: "pro",
        name: "Pro Pack",
        credits: 4000,
        price: 2000,
        description: "4,000 Credits — generate up to 1,000 high-engagement posts.",
      },
      business: {
        id: "business",
        name: "Business Pack",
        credits: 10000,
        price: 5000,
        description: "10,000 Credits — generate up to 2,500 high-engagement posts.",
      },
    },
  },
  ai: {
    apiKey: process.env.MU_API_KEY,
    pollEndpoint: (requestId) =>
      `https://api.muapi.ai/api/v1/predictions/${requestId}/result`,
    model: {
      id: "any-llm",
      name: "Any LLM (Text to Text)",
      creditCost: 4, // Charged at 4 credits per post
      endpoint: "https://api.muapi.ai/api/v1/any-llm-models",
      description: "Generates high-conversion, highly-readable social media copies.",
    },
    platforms: SOCIAL_PLATFORMS,
    tones: SOCIAL_TONES,
  },
  db: {
    url: process.env.DATABASE_URL,
  },
};

export default config;
export { SOCIAL_PLATFORMS, SOCIAL_TONES };
