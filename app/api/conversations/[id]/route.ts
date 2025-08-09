import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ObjectId } from "mongodb";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const conversationId = new ObjectId(id);
  const conversation = await db
    .collection("conversations")
    .findOne({ _id: conversationId, userEmail: session.user.email });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const messages = await db
    .collection("messages")
    .find({ conversationId })
    .sort({ createdAt: 1 })
    .toArray();
  return NextResponse.json({
    id,
    title: conversation.title,
    messages: messages.map((m) => ({
      id: String(m._id),
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
  });
}


