import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ObjectId } from "mongodb";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt : "";
    const modelName =
      typeof body?.modelName === "string" && body.modelName.length > 0
        ? body.modelName
        : "gemini-1.5-flash";
    const conversationIdInput =
      typeof body?.conversationId === "string" ? body.conversationId : undefined;

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const aiClient = new GoogleGenerativeAI(apiKey);
    const model = aiClient.getGenerativeModel({ model: modelName });

    // Optional: save history if signed-in
    const session = (await getServerSession(authOptions as any)) as any;
    const client = await clientPromise;
    const db = client.db();

    let conversationId: ObjectId | undefined;
    if (session?.user?.email) {
      if (conversationIdInput) {
        conversationId = new ObjectId(conversationIdInput);
      } else {
        const title = prompt.length > 40 ? `${prompt.slice(0, 40)}…` : prompt;
        const created = await db.collection("conversations").insertOne({
          userEmail: session.user.email,
          title: title || "New conversation",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        conversationId = created.insertedId;
      }
      if (conversationId) {
        await db.collection("messages").insertOne({
          conversationId,
          role: "user",
          content: prompt,
          createdAt: new Date(),
        });
      }
    }

    const result = await model.generateContent([{ text: prompt }]);
    const text = result.response.text();

    if (session?.user?.email && conversationId) {
      await db.collection("messages").insertOne({
        conversationId,
        role: "assistant",
        content: text,
        createdAt: new Date(),
      });
      await db
        .collection("conversations")
        .updateOne({ _id: conversationId }, { $set: { updatedAt: new Date() } });
    }

    return NextResponse.json({ text, conversationId: conversationId ? String(conversationId) : undefined });
  } catch (error) {
    const message =
      typeof error === "object" && error && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to generate response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


