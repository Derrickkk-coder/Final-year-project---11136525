import nodemailer from 'nodemailer'

// Using explicit SMTP settings instead of the `service: 'gmail'` shorthand,
// with `family: 4` forcing an IPv4 connection — Render's outbound network
// doesn't reliably route IPv6, and Node tries IPv6 first by default.
//
// The timeout values matter too: without them, a hung connection can block
// for a long time before failing. These make sure any network problem
// surfaces quickly (a few seconds) rather than hanging indefinitely.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
})

export async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: `"NextLeap" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  })
}

export function verificationEmailTemplate({ name, verifyUrl }) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #16232B;">
    <div style="background: #004F6D; padding: 20px 24px; border-radius: 10px 10px 0 0;">
      <span style="color: #fff; font-size: 20px; font-weight: bold;">NextLeap</span>
    </div>
    <div style="background: #ffffff; border: 1px solid #E2E9EB; border-top: none; border-radius: 0 0 10px 10px; padding: 32px 24px;">
      <h2 style="margin: 0 0 16px; font-size: 20px;">Verify your email address</h2>
      <p style="line-height: 1.6; color: #5A6D74;">
        Hi ${name}, thanks for signing up on NextLeap. Please confirm your email address to activate your account.
      </p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${verifyUrl}" style="background: #FF6A45; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-weight: bold; display: inline-block;">
          Verify email address
        </a>
      </p>
      <p style="line-height: 1.6; color: #5A6D74; font-size: 13px;">
        This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
      </p>
      <p style="line-height: 1.6; color: #8FA1A7; font-size: 12px; word-break: break-all;">
        Or paste this link into your browser: ${verifyUrl}
      </p>
    </div>
  </div>
  `
}