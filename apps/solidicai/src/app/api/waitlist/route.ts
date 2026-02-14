import { createClient } from "@web3web4/shared-platform/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { interested_plan } = body;

  if (!["starter", "pro", "enterprise"].includes(interested_plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { error: insertError } = await supabase
    .from("subscription_waitlist")
    .upsert(
      {
        user_id: user.id,
        email: user.email!,
        interested_plan,
      },
      {
        onConflict: "user_id",
      },
    );

  if (insertError) {
    console.error("Waitlist insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to register interest" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
