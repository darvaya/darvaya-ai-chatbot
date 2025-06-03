import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const { messages } = json;

    if (!messages) {
      return new Response("No messages in the request", { status: 400 });
    }

    // Create a stream using the AI SDK
    const result = await streamText({
      model: openai.chat("gpt-4-turbo-preview"),
      messages: messages.map((message: any) => ({
        role:
          message.role === "assistant"
            ? "assistant"
            : message.role === "system"
              ? "system"
              : "user",
        content: message.content,
      })),
    });

    // Return the streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[Chat Error]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
