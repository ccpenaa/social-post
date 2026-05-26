# AI Social Post Generator

![AI Social Post Generator Dashboard UI](https://cdn.muapi.ai/data/2/549775676598/Screenshot_2026-05-26_181917.png)

Generate highly engaging, optimized, and high-conversion social media posts for multiple platforms using AI. Powered by MuAPI's `any-llm` model with tailored tone structures and visual preview mockups.

## 🌐 Project Details

**GitHub Repository:** [github.com/SamurAIGPT/social-post](https://github.com/SamurAIGPT/social-post)

**Live Demo Preview:** [social-post.vercel.app](https://social-post.vercel.app/)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/social-post&env=DATABASE_URL,DIRECT_URL,NEXTAUTH_URL,NEXTAUTH_SECRET,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,MU_API_KEY,WEBHOOK_URL,STRIPE_SECRET_KEY,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,STRIPE_WEBHOOK_SECRET)

---

## ✨ Features

- 💼 **6 Premium Platforms** — LinkedIn, Twitter / X, Facebook, Instagram, Reddit, and LINE
- 🎨 **5 Custom Tones** — Professional, Casual, Inspirational, Humorous, and Bold
- ⚡ **Instant Post Generation** — AI-powered high-engagement copies generated in seconds
- 💳 **Just 4 Credits Per Post** — Deducts only 4 credits ($0.02) per generated post
- 📋 **One-Click Clipboard copy** — Instantly copy generated posts to your clipboard
- 📱 **Platform-Specific Mockups** — View what your post will look like directly inside feed simulations (including X character counters)
- 🔐 **Google Authentication** — Secure and unified sign-in using Google OAuth
- 🛍️ **Stripe Package Purchases** — Buy one-time credit bundles securely via Stripe, no subscription required
- 🔄 **DB Self-Healing Synchronization** — Dynamic background status updates syncing processing items automatically

---

## 🚀 Deploy

Click the button below to deploy your own instance to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/social-post&env=DATABASE_URL,DIRECT_URL,NEXTAUTH_URL,NEXTAUTH_SECRET,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,MU_API_KEY,WEBHOOK_URL,STRIPE_SECRET_KEY,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,STRIPE_WEBHOOK_SECRET)

---

## ⚙️ Environment Variables

Create a `.env` file based on `.env.example` in the root directory:

```env
# Database connection URLs (from Supabase shared pool)
DATABASE_URL="postgresql://postgres:[password]@db.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@db.supabase.co:5432/postgres"

# NextAuth base configuration
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="use_a_secure_random_string"

# Google Auth Client Secrets
GOOGLE_CLIENT_ID="google_client_id_from_google_developer_console"
GOOGLE_CLIENT_SECRET="google_client_secret_from_google_developer_console"

# MuAPI Key configuration for AI model generation
MU_API_KEY="your_secure_mu_api_key"

# Webhook configuration for slow-running prediction notifications
WEBHOOK_URL="https://your-domain.com"

# Stripe configurations for credit purchases
STRIPE_SECRET_KEY="stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="stripe_webhook_secret"
```

---

## 🗄️ Database Setup (Prisma Introspection Cycle)

> ⚠️ **Database Safety Warning**: This application shares a single PostgreSQL database instance on Supabase with other applications in this workspace. Follow the cycle below to synchronize models safely:

1. **Pull all existing tables**: `npx prisma db pull` (introspects all 20+ active tables)
2. **Declare relation changes**: Inject the `SocialPostCreation` model in your local `schema.prisma` and link it inside the `User` model.
3. **Push to database**: Run `npx prisma db push` to merge changes safely.
4. **Local Schema Cleanup**: Strip away other applications' models from your local `schema.prisma`, leaving only `Account`, `Session`, `User`, `VerificationToken`, and `SocialPostCreation`.
5. **Compile local client**: Run `npx prisma generate` to build your local Prisma client.

---

## 💻 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Launch development server**:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) inside your web browser.

---

## 🏗️ Technical Architecture

- **Core**: Next.js 16 (App Router)
- **AI Model**: MuAPI `any-llm` (Google Gemini 2.5 Flash provider)
- **Database**: PostgreSQL (Supabase shared pool) using Prisma ORM
- **Auth**: NextAuth.js v4 with Google OAuth + Prisma Adapter
- **Payments**: Stripe Checkout one-time package purchases
- **Styling**: Tailwind CSS v4 featuring premium glassmorphism dark templates
