import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { getProfile, saveProfile, type ProfileInput } from "@/lib/profile-repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = readSession(request);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  return NextResponse.json({ profile: await getProfile(session.id) });
}

export async function POST(request: Request) {
  const session = readSession(request);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = (await request.json()) as Partial<ProfileInput>;
  const profile: ProfileInput = { name: body.name?.trim() ?? "", email: body.email?.trim() ?? "", phone: body.phone?.trim() ?? "", location: body.location?.trim() ?? "", headline: body.headline?.trim() ?? "", countries: body.countries?.trim() ?? "", skills: body.skills?.trim() ?? "", source: body.source === "uploaded_resume" ? "uploaded_resume" : "manual" };
  if (!profile.name || !profile.email) return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  return NextResponse.json({ profile: await saveProfile(session.id, profile) }, { status: 201 });
}
