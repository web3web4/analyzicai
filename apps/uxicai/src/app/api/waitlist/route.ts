import {
  createClient,
  createServiceClient,
} from "@web3web4/shared-platform/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const serviceSupabase = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json();
  const { interested_plan, email: bodyEmail } = body;

  if (!["starter", "pro", "enterprise"].includes(interested_plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (user) {
    // Authenticated: upsert by user_id
    const { error: insertError } = await serviceSupabase
      .from("subscription_waitlist")
      .upsert(
        { user_id: user.id, email: user.email!, interested_plan },
        { onConflict: "user_id" },
      );
    if (insertError) {
      console.error("Waitlist insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to register interest" },
        { status: 500 },
      );
    }
  } else {
    // Anonymous: require email in body, upsert by email
    if (!bodyEmail || !EMAIL_RE.test(bodyEmail)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }
    const { error: insertError } = await serviceSupabase
      .from("subscription_waitlist")
      .upsert({ email: bodyEmail, interested_plan }, { onConflict: "email" });
    if (insertError) {
      console.error("Waitlist insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to register interest" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true });
}
