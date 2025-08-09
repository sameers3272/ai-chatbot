"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-sm text-zinc-400">Loading…</div>;
  }
  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className="px-3 py-2 text-sm rounded-md bg-zinc-800 hover:bg-zinc-700"
      >
        Sign in with Google
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3">
      {session.user?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={session.user.image} alt="avatar" className="h-7 w-7 rounded-full" />
      )}
      <span className="text-sm text-zinc-300">{session.user?.name || session.user?.email}</span>
      <button
        onClick={() => signOut()}
        className="px-3 py-2 text-sm rounded-md bg-zinc-800 hover:bg-zinc-700"
      >
        Sign out
      </button>
    </div>
  );
}


