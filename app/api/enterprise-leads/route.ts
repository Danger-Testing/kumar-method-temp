import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!name || !company || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid name, company, and email." }, { status: 400 });
    }
    const { error } = await createClient().from("enterprise_leads").insert({ name, company, email });
    if (error) {
      console.error("Unable to save enterprise lead", error);
      return NextResponse.json({ error: "We couldn't save your request. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Enterprise lead request failed", error);
    return NextResponse.json({ error: "We couldn't save your request. Please try again." }, { status: 500 });
  }
}
