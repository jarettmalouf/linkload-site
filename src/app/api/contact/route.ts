import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ContactFormData = await request.json();

    if (!data.name || !data.email || !data.subject || !data.message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Store in Supabase
    const { error: dbError } = await supabase
      .from("contact_submissions")
      .insert([
        {
          name: data.name,
          email: data.email,
          company: data.company || null,
          subject: data.subject,
          message: data.message,
          created_at: new Date().toISOString(),
        },
      ]);

    if (dbError) {
      console.error("Supabase error:", dbError);
    }

    // Send notification email to Jarett
    const { error: emailError } = await resend.emails.send({
      from: "LinkLoad <notifications@linkload.co>",
      to: "jarett@linkload.co",
      replyTo: data.email,
      subject: `[Contact] ${data.subject} - ${data.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
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
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Company</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.company || "Not specified"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Subject</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.subject}</td>
          </tr>
        </table>
        <h3 style="margin-top: 24px;">Message</h3>
        <p style="white-space: pre-wrap; background: #f5f5f5; padding: 16px; border-radius: 8px;">${data.message}</p>
        <p style="margin-top: 20px; color: #666;">
          Submitted at ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })} PT
        </p>
      `,
    });

    if (emailError) {
      console.error("Resend error:", JSON.stringify(emailError, null, 2));
      return NextResponse.json(
        { error: "Failed to send message", details: emailError.message },
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
