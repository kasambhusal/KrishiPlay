// /app/api/gemini/route.ts (Next.js 13+/App Router)
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const chatCompletion = await groq.chat.completions.create({
      model: "qwen/qwen3-32b", // good reasoning + long context
      temperature: 0.6,
      max_completion_tokens: 256,
      messages: [
        {
          role: "system",
          content:
            "You are an AI agricultural assistant that provides realistic and location-based crop recommendations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const result =
      chatCompletion.choices?.[0]?.message?.content?.trim() || "No result found.";

    // Split numbered list like "1. Rice\n2. Maize" into array
    const recommendations = result
      .split(/\n+/)
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Groq API error:", error);
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}
