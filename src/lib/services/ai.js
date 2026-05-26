import { prisma } from "@/lib/prisma";
import { UserService } from "./user";
import config, { SOCIAL_PLATFORMS, SOCIAL_TONES } from "@/lib/config";

export const AIService = {
  async generateSocialPost(userId, { topic, platformId, toneId, includeEmojis, includeHashtags }) {
    const cost = config.ai.model.creditCost; // 4 credits
    
    // 1. Deduct credits first
    await UserService.deductCredits(userId, cost);

    const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId) || SOCIAL_PLATFORMS[0];
    const tone = SOCIAL_TONES.find(t => t.id === toneId) || SOCIAL_TONES[0];

    const apiKey = config.ai.apiKey;
    if (!apiKey || apiKey.includes("your_") || apiKey.trim() === "") {
      console.warn("MU_API_KEY is not configured or invalid. Falling back to local Mock Social Post Generation.");
      // Create mock post directly
      const request_id = `mock_${Date.now()}`;
      const creation = await prisma.socialPostCreation.create({
        data: {
          userId,
          topic,
          platform: platform.name,
          tone: tone.name,
          emoji: includeEmojis,
          status: "processing",
          requestId: request_id,
          creditCost: cost,
        }
      });
      return creation;
    }

    // 2. Formulate advanced prompt instructing the LLM to return JSON
    const systemPrompt = `You are an expert social media manager and high-conversion copywriter.
Your task is to generate an exceptionally engaging and optimized social media post based on a user's topic.
You must adapt your copy strictly to the target platform and requested tone.

Platform Rules:
- LinkedIn: Focus on industry insights, professional growth, structured lists, strong hooks, and high-value professional CTAs.
- Twitter/X: Keep it highly engaging, punchy, and short. Create a hook that commands attention. Strictly limit the copy to under 280 characters to fit perfectly.
- Facebook: Friendly, relatable, community-oriented, structured, and encourages comments/shares.
- Instagram: Rich visually, includes an attention-grabbing first line, friendly body, a strong call to action, and a clean layout.

Tone Rules:
- Professional: business-oriented, authoritative, corporate, and polished.
- Casual: friendly, conversational, approachable, and warm.
- Inspirational: uplifting, thought-provoking, motivating, and high-energy.
- Humorous: witty, clever, funny, and light-hearted.
- Bold: strong, assertive, disruptive, highly engaging, and confident.

General Formatting Rules:
- Include emojis: ${includeEmojis ? "YES, use descriptive emojis naturally throughout the copy." : "NO, do not use any emojis at all."}
- Include hashtags: ${includeHashtags ? "YES, suggest 3-5 relevant, highly-targeted hashtags at the bottom." : "NO, do not include any hashtags."}

You must respond ONLY with a raw JSON object (do not include markdown code block styling or any additional text, just the raw JSON) with the following structure:
{
  "postText": "The actual post content with linebreaks, emojis, and hashtags",
  "suggestedHashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "headline": "A short catchy headline or main hook used in the post"
}`;

    const userPrompt = `Generate a social media post for ${platform.name} using a ${tone.name} tone of voice.
Topic/Details: ${topic}
Ensure the copy is highly engaging, reads naturally, and captures the user's focus immediately.`;

    try {
      const submitRes = await fetch("https://api.muapi.ai/api/v1/any-llm-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          prompt: userPrompt,
          system_prompt: systemPrompt,
          model: "google/gemini-2.5-flash",
          reasoning: false,
          priority: "throughput",
          temperature: 0.8,
          max_tokens: null
        }),
      });

      if (!submitRes.ok) {
        const errorText = await submitRes.text();
        throw new Error(`MuAPI submission failed: ${submitRes.status} ${errorText}`);
      }

      const { request_id } = await submitRes.json();
      if (!request_id) {
        throw new Error("No request_id received from MuAPI");
      }

      // 3. Create the SocialPostCreation in 'processing' status
      const creation = await prisma.socialPostCreation.create({
        data: {
          userId,
          topic,
          platform: platform.name,
          tone: tone.name,
          emoji: includeEmojis,
          status: "processing",
          requestId: request_id,
          creditCost: cost,
        }
      });

      return creation;
    } catch (err) {
      console.warn("AI generation API failed. Falling back to local Mock Social Post Generation. Error:", err.message);
      // Create mock creation directly as fallback
      const request_id = `mock_fallback_${Date.now()}`;
      const creation = await prisma.socialPostCreation.create({
        data: {
          userId,
          topic,
          platform: platform.name,
          tone: tone.name,
          emoji: includeEmojis,
          status: "processing",
          requestId: request_id,
          creditCost: cost,
        }
      });
      return creation;
    }
  },

  async checkStatus(requestId) {
    const creation = await prisma.socialPostCreation.findUnique({
      where: { requestId }
    });

    if (!creation) return null;

    if (creation.status === "completed") {
      return { status: "completed", creation };
    }

    if (creation.status === "failed") {
      return { status: "failed", error: creation.error || "Generation failed" };
    }

    // Check if it's a mock request (starts with 'mock_')
    if (requestId && requestId.startsWith("mock_")) {
      const elapsed = Date.now() - new Date(creation.createdAt).getTime();
      if (elapsed < 3000) {
        return { status: "processing" };
      }

      // Generate a beautiful mock post depending on platform and tone
      const platform = creation.platform;
      const tone = creation.tone;
      const emojis = creation.emoji;
      const topic = creation.topic;

      let postText = "";
      let headline = "";
      let suggestedHashtags = [];

      if (platform === "LinkedIn") {
        headline = `Unlocking the Future of ${topic}`;
        postText = `${emojis ? "🚀 " : ""}Unlocking the potential of ${topic} is no longer a luxury—it's a critical growth mechanism in today's landscape.\n\nHere are 3 core frameworks I've implemented to turn challenges into measurable success:\n\n${emojis ? "1️⃣ " : "1. "}Focus on High-Impact Leverage: Stop spread-out efforts and align resources toward a single high-conversion metric.\n${emojis ? "2️⃣ " : "2. "}Adopt Dynamic Workflows: Emphasize structural speed over bureaucratic alignment.\n${emojis ? "3️⃣ " : "3. "}Continuous Execution Iterations: Build, deploy, measure, and optimize.\n\n${emojis ? "💡 " : ""}What's the #1 strategy you are deploying in your organization to navigate these topics? Let's connect in the comments below!`;
        suggestedHashtags = ["growth", "strategy", "innovation", "linkedinlearn"];
      } else if (platform === "Twitter / X") {
        headline = `Hot take on ${topic}`;
        postText = `Most teams struggle with ${topic} because they prioritize planning over direct execution. ${emojis ? "🔥\n\n" : "\n\n"}Real growth happens when you launch, collect real data, and adapt in real-time. Stop waiting for perfect alignment.\n\nDo you agree? Let's discuss. ${emojis ? "👇" : ""}`;
        suggestedHashtags = ["execution", "buildinpublic", "socialpost"];
      } else if (platform === "Instagram") {
        headline = `The Magic Behind ${topic}`;
        postText = `THE SECRET TO ${topic.toUpperCase()} ${emojis ? "✨\n\n" : "\n\n"}Have you ever wondered what separates sustainable progress from temporary spikes? It all boils down to structural consistency and dynamic adaptability.\n\nWe are sharing the exact blueprint we used to scale this month. ${emojis ? "👇\n\n" : "\n\n"}Click the link in our bio to read the full case study and take your business to the next level!`;
        suggestedHashtags = ["businessgrowth", "casestudy", "igstrategy", "success"];
      } else {
        // Facebook / general
        headline = `Let's talk about ${topic}`;
        postText = `${emojis ? "👋 " : ""}Hello everyone! Let's talk about ${topic} today. I've been getting a lot of questions about how to handle this area, and I wanted to share my top tip:\n\nAlways focus on building strong foundations first before scaling up. This is the only way to ensure steady and healthy progress.\n\n${emojis ? "💬 " : ""}How do you approach this in your daily routine? Let me know in the comments, I'd love to hear your experiences!`;
        suggestedHashtags = ["sharing", "community", "tips", "facebookpost"];
      }

      if (creation.emoji) {
        postText += `\n\n${suggestedHashtags.map(h => `#${h}`).join(" ")}`;
      }

      const updated = await prisma.socialPostCreation.update({
        where: { id: creation.id },
        data: {
          resultText: JSON.stringify({ postText, headline, suggestedHashtags }),
          status: "completed",
        }
      });

      return { status: "completed", creation: updated };
    }

    const apiKey = config.ai.apiKey;
    if (!apiKey) throw new Error("MU_API_KEY is not configured");

    try {
      const res = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        }
      });

      if (!res.ok) {
        console.error("Polling endpoint returned error:", res.status);
        return { status: "processing" };
      }

      const result = await res.json();
      const state = result.status || result.state;

      if (state === "completed" || state === "succeeded") {
        const outputs = result.outputs || [];
        const rawOutput = outputs[0] || result.output;
        
        let textResult = "";
        if (typeof rawOutput === "string") {
          textResult = rawOutput;
        } else if (rawOutput && rawOutput.text) {
          textResult = rawOutput.text;
        } else if (rawOutput && rawOutput.video) {
          // Note: In MuAPI, some text models erroneously return the output key as "video" in the schema
          textResult = rawOutput.video;
        } else if (result.result) {
          textResult = typeof result.result === "string" ? result.result : JSON.stringify(result.result);
        }

        if (!textResult) {
          throw new Error("Empty text output from model");
        }

        // Clean markdown wraps if the model returned markdown blocks
        let jsonStr = textResult.trim();
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.substring(7);
        }
        if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.substring(3);
        }
        if (jsonStr.endsWith("```")) {
          jsonStr = jsonStr.substring(0, jsonStr.length - 3);
        }
        jsonStr = jsonStr.trim();

        // Validate JSON
        let parsed = {};
        try {
          parsed = JSON.parse(jsonStr);
        } catch (e) {
          console.warn("Failed to parse AI output as JSON, fallback to standard text wrapping:", e);
          parsed = {
            postText: textResult,
            headline: "AI Social Post",
            suggestedHashtags: [],
          };
        }

        const updated = await prisma.socialPostCreation.update({
          where: { id: creation.id },
          data: {
            resultText: JSON.stringify(parsed),
            status: "completed",
          }
        });

        return { status: "completed", creation: updated };
      } else if (state === "failed") {
        const errorMsg = result.error || "Prediction failed";
        await prisma.socialPostCreation.update({
          where: { id: creation.id },
          data: {
            status: "failed",
            error: errorMsg
          }
        });

        // Refund exact credits
        await UserService.addCredits(creation.userId, creation.creditCost);
        return { status: "failed", error: errorMsg };
      }
    } catch (e) {
      console.error("Polling error in checkStatus:", e);
    }

    return { status: "processing" };
  }
};
