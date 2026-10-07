import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const PING_INTERVAL_DAYS = 5;

export async function GET() {
  try {
    // Check when we last pinged
    const { data: pingData, error: pingError } = await supabase
      .from("health_pings")
      .select("last_ping")
      .eq("id", 1)
      .single();

    if (pingError) {
      console.error("Error reading health_pings:", pingError);
    }

    let didWrite = false;

    // Write a ping if it's been more than 5 days (or no data exists)
    if (pingData) {
      const lastPing = new Date(pingData.last_ping);
      const now = new Date();
      const daysSinceLastPing = (now.getTime() - lastPing.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceLastPing >= PING_INTERVAL_DAYS) {
        const { error: updateError } = await supabase
          .from("health_pings")
          .update({ last_ping: now.toISOString() })
          .eq("id", 1);

        if (updateError) {
          console.error("Error updating health_pings:", updateError);
        } else {
          didWrite = true;
        }
      }
    }

    // Also do a read to verify general connectivity
    const { count } = await supabase
      .from("cofounder_applications")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      db: "connected",
      applications_count: count ?? 0,
      last_write_ping: pingData?.last_ping ?? null,
      did_write: didWrite,
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { status: "error", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
