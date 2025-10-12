"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, Bot, User, Sparkles, X } from "lucide-react";
// Assuming these are standard components (shadcn/ui or similar)
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GeminiRecommendationProps {
  location: { lat: number; lon: number };
  weatherData: {
    temperature: number;
    precipitation: number;
    elevation?: number;
    soilType?: string;
  };
}

// Simple, self-contained Markdown Renderer for the AI's output format
const MarkdownRenderer = ({ text }: { text: string }) => {
  // Function to convert simple markdown to HTML using regex
  const renderMarkdown = (markdownText: string): string => {
    // 1. Convert **bold** to <strong>
    let html = markdownText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // 2. Handle paragraphs and line breaks for general text.
    // The main content of the AI response usually comes with line breaks (\n).
    const parts = html.split("\n");
    let isListActive = false;
    let finalHtml = "";

    for (const part of parts) {
      const trimmedPart = part.trim();

      // Check for bullet points starting with '* '
      if (trimmedPart.startsWith("* ")) {
        if (!isListActive) {
          finalHtml += '<ul class="list-disc ml-5 space-y-1 mt-2">';
          isListActive = true;
        }
        let listItem = trimmedPart.substring(2); // remove '* '
        finalHtml += `<li>${listItem}</li>`;
      } else {
        if (isListActive) {
          finalHtml += "</ul>";
          isListActive = false;
        }
        // If it's not empty, treat it as a paragraph
        if (trimmedPart.length > 0) {
          finalHtml += `<p class="mb-2">${trimmedPart}</p>`;
        }
      }
    }

    if (isListActive) {
      finalHtml += "</ul>"; // Close the last list if it was active
    }

    return finalHtml;
  };

  const renderedHtml = renderMarkdown(text);

  return (
    <div
      className="markdown-content prose prose-green max-w-none text-sm leading-relaxed"
      // Note: Using dangerouslySetInnerHTML is necessary here to render the generated HTML structures (<ul>, <li>)
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

export default function GeminiRecommendation({
  location,
  weatherData,
}: GeminiRecommendationProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<
    { sender: "user" | "bot"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const cleanText = (raw: any) => {
    if (!raw) return "";
    let text = Array.isArray(raw) ? raw.join(" ") : raw;
    return text
      .replace(/<think>[\s\S]*?<\/think>/g, "") // remove reasoning
      .replace(/<think>|<\/think>/g, "")
      .trim();
  };

  const fetchMessage = async (
    prompt: string,
    sender: "user" | "bot" = "user"
  ) => {
    if (sender === "user")
      setMessages((prev) => [...prev, { sender, text: prompt }]);
    setLoading(true);

    try {
      // NOTE: We don't need to manually prepend the system instruction here,
      // as the backend (route.ts) is already configured to handle the persona via the systemInstruction field.
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      const botText =
        cleanText(data.recommendations) ||
        cleanText(data.text) ||
        "Sorry, I couldn’t generate a response.";

      setMessages((prev) => [...prev, { sender: "bot", text: botText }]);
    } catch (err) {
      console.error("Gemini error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Network error. Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    fetchMessage(input, "user");
    setInput("");
  };

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      // Automatically generate the initial recommendation prompt
      const introPrompt = `
You are Krishi AI — a friendly agricultural assistant.
Based on this data, give a warm intro and 3–4 recommended crops for this region. Ensure all recommendations are in a bulleted list format.
- Location: lat ${location.lat}, lon ${location.lon}
- Avg temperature: ${weatherData.temperature}°C
- Avg precipitation: ${weatherData.precipitation}mm
- Elevation: ${weatherData.elevation}m
- Soil type: ${weatherData.soilType}
`;
      fetchMessage(introPrompt, "bot");
    }
  };

  return (
    <>
      {/* 🌟 Floating Button */}
      <motion.div
        className="absolute top-4 left-4 bg-white/40 backdrop-blur-lg rounded-2xl p-3 cursor-pointer shadow-lg border border-white/20 z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpen}
      >
        <Sparkles className="text-green-700" size={26} />
      </motion.div>

      {/* 💬 Chat Window */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <Card className="relative w-full max-w-3xl h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-green-300">
            {/* Header */}
            <div className="flex items-center justify-between bg-[#006634] text-white px-5 py-3 rounded-t-3xl">
              <div className="flex items-center space-x-2">
                <Bot size={26} />
                <h2 className="text-xl font-semibold">Krishi AI</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-green-700 rounded-full transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[80%] ${
                      msg.sender === "user"
                        ? "flex-row-reverse space-x-reverse"
                        : ""
                    }`}
                  >
                    {msg.sender === "bot" ? (
                      <Bot className="text-[#006634] mt-1" size={22} />
                    ) : (
                      <User className="text-blue-600 mt-1" size={22} />
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm ${
                        msg.sender === "user"
                          ? "bg-[#006634] text-white"
                          : "bg-green-100 text-gray-800"
                      }`}
                    >
                      {/* --- OPTIMIZATION HERE: Use MarkdownRenderer for bot text --- */}
                      {msg.sender === "bot" ? (
                        <MarkdownRenderer text={msg.text} />
                      ) : (
                        // User text can remain plain text
                        <p>{msg.text}</p>
                      )}
                      {/* ----------------------------------------------------------- */}
                    </div>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Loader2 className="animate-spin text-[#006634]" size={20} />
                  <span>Krishi AI is responding...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Krishi AI about crops, soil, or farming..."
                className="flex-1 rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button
                onClick={handleSend}
                className="rounded-full bg-[#006634] hover:bg-green-700 p-3"
              >
                <Send size={18} />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
