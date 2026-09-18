import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const GATE_COOKIE_NAME = "linkload_access";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days
const ACCESS_CODE = "link";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (code !== ACCESS_CODE) {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 });
    }

    // Create token with expiration
    const token = Buffer.from(
      JSON.stringify({ exp: Date.now() + COOKIE_MAX_AGE * 1000 })
    ).toString("base64");

    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set(GATE_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gate error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
