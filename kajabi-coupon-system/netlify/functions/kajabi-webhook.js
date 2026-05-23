import { supabase } from "../../lib/supabase.js"
import { resend } from "../../lib/resend.js"

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}")
    const { email, name } = body

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing email" })
      }
    }

    const { data: coupon, error } = await supabase.rpc("get_coupon")

    if (error || !coupon || coupon.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No coupons left" })
      }
    }

    const code = coupon[0].code

    await resend.emails.send({
      from: "onboarding@yourdomain.com",
      to: email,
      subject: "Your Coupon Code 🎁",
      html: `<h2>Hello ${name || ""}</h2><p>Your coupon:</p><h1>${code}</h1>`
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, code })
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}
