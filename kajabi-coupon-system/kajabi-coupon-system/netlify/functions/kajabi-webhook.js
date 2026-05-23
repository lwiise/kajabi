import { supabase } from "../../lib/supabase.js"
import { resend } from "../../lib/resend.js"

export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    }
  }

  try {
    const body = JSON.parse(event.body || "{}")

    // Kajabi sends different field names depending on the event.
    // Try a few common shapes so this works out of the box.
    const email =
      body.email ||
      body.member?.email ||
      body.payload?.email ||
      body.data?.email

    const name =
      body.name ||
      body.first_name ||
      body.member?.name ||
      body.member?.first_name ||
      body.payload?.name ||
      ""

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing email in payload" })
      }
    }

    // Atomically grab an unused coupon and assign it to this email.
    // IMPORTANT: get_coupon now takes a user_email parameter.
    const { data: coupon, error } = await supabase.rpc("get_coupon", {
      user_email: email
    })

    if (error) {
      console.error("Supabase error:", error)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Database error", details: error.message })
      }
    }

    if (!coupon || coupon.length === 0) {
      console.warn("No coupons left for:", email)
      return {
        statusCode: 409,
        body: JSON.stringify({ error: "No coupons available" })
      }
    }

    const code = coupon[0].code

    // Send the coupon email via Resend
    const { error: emailError } = await resend.emails.send({
      // For testing: use "onboarding@resend.dev" (works without a verified domain,
      // but can ONLY send to the email you signed up to Resend with).
      // For production: verify your domain in Resend and use an address on it.
      from: "onboarding@resend.dev",
      to: email,
      subject: "Your Coupon Code 🎁",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Hi ${name || "there"} 👋</h2>
          <p>Thanks for your purchase! Here is your coupon code:</p>
          <div style="background: #f4f4f4; padding: 24px; text-align: center; border-radius: 8px; margin: 24px 0;">
            <h1 style="margin: 0; letter-spacing: 3px; color: #111; font-size: 32px;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">If you have any questions, just reply to this email.</p>
        </div>
      `
    })

    if (emailError) {
      console.error("Resend error:", emailError)
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Email send failed",
          code,
          details: emailError.message
        })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, code })
    }
  } catch (err) {
    console.error("Handler error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}
