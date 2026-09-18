import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

interface WaitlistFormData {
  name: string;
  email: string;
  ageRange: string;
  gender: string;
  role: string;
  cityZip: string;
  setup: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: WaitlistFormData = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.ageRange || !data.role || !data.cityZip || !data.setup) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Store in Supabase
    const { error: dbError } = await supabase
      .from("waitlist")
      .insert([
        {
          name: data.name,
          email: data.email,
          age_range: data.ageRange,
          gender: data.gender || null,
          role: data.role,
          city_zip: data.cityZip,
          setup: data.setup,
          created_at: new Date().toISOString(),
        },
      ]);

    if (dbError) {
      console.error("Supabase error:", dbError);
      // Continue even if DB fails - we still want to send the email
    }

    // Send notification email to Jarett
    const { error: emailError } = await resend.emails.send({
      from: "LinkLoad <notifications@linkload.co>",
      to: "jarett@linkload.co",
      subject: `New Pre-Order Application: ${data.name}`,
      html: `
        <h2>New Pre-Order Application</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Name</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Email</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="mailto:${data.email}">${data.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Age Range</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.ageRange}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Gender</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.gender || "Not specified"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Role</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.role}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Location</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.cityZip}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Current Setup</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.setup}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; color: #666;">
          Submitted at ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })} PT
        </p>
      `,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return NextResponse.json(
        { error: "Failed to send notification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
