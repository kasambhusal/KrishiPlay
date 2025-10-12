import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize the client
// IMPORTANT: The client is initialized outside the handler to avoid performance issues
// on every request.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Define the system instruction for the AI's persona.
const SYSTEM_INSTRUCTION = `
You are **Krishi AI**, a friendly and knowledgeable Nepali agricultural assistant.
Your job: Give practical, simple, and accurate crop recommendations or answers.
**IMPORTANT:** Your response must be generated entirely in the English language.

Output style:
- Start with a warm greeting in English.
- Provide a clear explanation.
- **Always list crop recommendations or suggestions using bullet points.**
- Avoid overly long paragraphs.
`.trim();

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "No prompt provided." },
        { status: 400 }
      );
    }

    // Configure generation settings. 
    // TypeScript fix: 'systemInstruction' must be nested inside the 'config' object.
    // Optimization: Increased maxOutputTokens to 2048 for a more complete response.
    const config = {
      temperature: 0.8,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 2048, // Increased for a more comprehensive response
      systemInstruction: SYSTEM_INSTRUCTION, // Moved here to fix the type error
    };

    // Call the API using the correct structure:
    // The systemInstruction is now correctly passed within the 'config' field.
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }], // Only the user query here
        },
      ],
      config: config,
      // Removed the top-level systemInstruction field
    });

    // Logging the full result is good for debugging, but be mindful of sensitive data.
    console.log("Gemini API response (fixed and optimized):", result);
    
    // The generated text is directly on the result object.
    const text = (result.text ?? "").trim();
    return NextResponse.json({ text });
    
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to generate Gemini response." },
      { status: 500 }
    );
  }
}