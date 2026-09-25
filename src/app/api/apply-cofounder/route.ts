import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const formData = await request.formData();

    // Honeypot check
    const honeypot = formData.get("website_url_confirm");
    if (honeypot) {
      return NextResponse.json({ success: true });
    }

    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const currentStatus = formData.get("currentStatus") as string;
    const schoolInstitution = formData.get("schoolInstitution") as string;
    const majorField = formData.get("majorField") as string;
    const linkedinUrl = formData.get("linkedinUrl") as string;
    const websiteUrl = formData.get("websiteUrl") as string;
    const cvFile = formData.get("cv") as File | null;

    // Validation
    if (!fullName || !email || !currentStatus || !majorField || !linkedinUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (currentStatus !== "Industry / not in school" && !schoolInstitution) {
      return NextResponse.json(
        { error: "School/institution is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!linkedinUrl.includes("linkedin.com")) {
      return NextResponse.json(
        { error: "Please provide a valid LinkedIn URL" },
        { status: 400 }
      );
    }

    let cvUrl: string | null = null;
    let cvFilename: string | null = null;

    // Upload CV if provided
    if (cvFile && cvFile.size > 0) {
      if (cvFile.type !== "application/pdf") {
        return NextResponse.json(
          { error: "CV must be a PDF file" },
          { status: 400 }
        );
      }

      if (cvFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "CV must be under 10MB" },
          { status: 400 }
        );
      }

      const timestamp = Date.now();
      const safeName = fullName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const filename = `${safeName}-${timestamp}.pdf`;

      const arrayBuffer = await cvFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("cv-uploads")
        .upload(filename, buffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload CV" },
          { status: 500 }
        );
      }

      const { data: urlData } = supabase.storage
        .from("cv-uploads")
        .getPublicUrl(filename);

      cvUrl = urlData.publicUrl;
      cvFilename = cvFile.name;
    }

    // Store in Supabase
    const { error: dbError } = await supabase
      .from("cofounder_applications")
      .insert([
        {
          full_name: fullName,
          email: email,
          current_status: currentStatus,
          school_institution: schoolInstitution || null,
          major_field: majorField,
          linkedin_url: linkedinUrl,
          website_url: websiteUrl || null,
          cv_url: cvUrl,
          cv_filename: cvFilename,
        },
      ]);

    if (dbError) {
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { error: "Failed to save application" },
        { status: 500 }
      );
    }

    // Send email notification
    const { error: emailError } = await resend.emails.send({
      from: "LinkLoad <notifications@linkload.co>",
      to: "jarett@linkload.co",
      replyTo: email,
      subject: `[Co-Founder Application] ${fullName}`,
      html: `
        <h2>New Mechanical Co-Founder Application</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Name</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Email</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Status</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${currentStatus}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">School/Institution</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${schoolInstitution || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Major/Field</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${majorField}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">LinkedIn</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="${linkedinUrl}">${linkedinUrl}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Website</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${websiteUrl ? `<a href="${websiteUrl}">${websiteUrl}</a>` : "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">CV/Resume</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${cvUrl ? `<a href="${cvUrl}">${cvFilename}</a>` : "Not provided"}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; color: #666;">
          Submitted at ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })} PT
        </p>
      `,
    });

    if (emailError) {
      console.error("Resend error:", JSON.stringify(emailError, null, 2));
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
