import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Ping Supabase to keep it active
    const { count } = await supabase
      .from("cofounder_applications")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      db: "connected",
      count: count ?? 0,
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { status: "error", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
