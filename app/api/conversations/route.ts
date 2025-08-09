import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const conversations = await db
    .collection("conversations")
    .find({ userEmail: session.user.email })
    .project({ title: 1 })
    .sort({ _id: -1 })
    .toArray();

  return NextResponse.json(
    conversations.map((c) => ({ id: String(c._id), title: c.title }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const { title } = await req.json();
  const result = await db.collection("conversations").insertOne({
    userEmail: session.user.email,
    title: title || "New conversation",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return NextResponse.json({ id: String(result.insertedId) });
}


