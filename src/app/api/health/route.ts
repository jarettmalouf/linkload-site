import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!;

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date().toISOString();

  const { error: writeError } = await supabase
    .from("health_pings")
    .upsert({ id: 1, last_ping: now }, { onConflict: "id" });

  if (writeError) {
    console.error("Health ping write failed:", writeError);
    return NextResponse.json(
      { status: "error", timestamp: now, error: writeError.message },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  return NextResponse.json(
    { status: "ok", timestamp: now, did_write: true },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
