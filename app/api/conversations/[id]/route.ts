import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ObjectId } from "mongodb";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const conversationId = new ObjectId(params.id);
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
    id: params.id,
    title: conversation.title,
    messages: messages.map((m) => ({
      id: String(m._id),
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
  });
}


