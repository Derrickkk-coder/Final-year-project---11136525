// Uses Brevo's transactional email HTTP API instead of raw SMTP.
// Render (and many free-tier hosts) block outbound SMTP ports (25/465/587)
// to prevent spam abuse — an HTTPS API call is unaffected by that, since
// blocking normal web traffic would break every app on the platform.
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

export async function sendEmail({ to, subject, html }) {
  // Fail with the actual cause rather than letting Brevo reject a request with
  // `sender.email: undefined` and a generic 400. Every caller is
  // fire-and-forget, so this message in the log is the only signal anyone gets
  // that email is misconfigured — it needs to name the missing variable.
  if (!process.env.EMAIL_USER) {
    throw new Error(
      'EMAIL_USER is not set. It must be an email address verified as a Sender in Brevo.'
    )
  }
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not set, so no email can be sent.')
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: 'NextLeap', email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Brevo API error (${response.status}): ${errorBody}`)
  }
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

// Status-specific copy for the applicant-facing email — kept separate from
// the generic status strings shown in the UI so the email can read naturally.
const STATUS_COPY = {
  review: {
    heading: 'Your application is being reviewed',
    body: 'is now under review. The employer is taking a closer look — we\'ll let you know as soon as there\'s an update.',
    accent: '#0C7C92',
  },
  shortlisted: {
    heading: 'You\'ve been shortlisted',
    body: 'has been shortlisted. The employer is considering you for the next stage and may be in touch to arrange an interview.',
    accent: '#0C7C92',
  },
  accepted: {
    heading: 'Good news about your application',
    body: 'has been accepted! The employer will be in touch with next steps.',
    accent: '#1E8E5A',
  },
  rejected: {
    heading: 'Update on your application',
    body: 'was not selected to move forward this time. Don\'t be discouraged — keep applying, the right role is out there.',
    accent: '#FF6A45',
  },
  pending: {
    heading: 'Your application has been received',
    body: 'is now marked as pending review with the employer.',
    accent: '#004F6D',
  },
}

export function applicationStatusEmailTemplate({ name, jobTitle, company, status }) {
  const copy = STATUS_COPY[status] || STATUS_COPY.pending

  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #16232B;">
    <div style="background: #004F6D; padding: 20px 24px; border-radius: 10px 10px 0 0;">
      <span style="color: #fff; font-size: 20px; font-weight: bold;">NextLeap</span>
    </div>
    <div style="background: #ffffff; border: 1px solid #E2E9EB; border-top: none; border-radius: 0 0 10px 10px; padding: 32px 24px;">
      <h2 style="margin: 0 0 16px; font-size: 20px; color: ${copy.accent};">${copy.heading}</h2>
      <p style="line-height: 1.6; color: #5A6D74;">
        Hi ${name}, your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> ${copy.body}
      </p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${process.env.CLIENT_URL}/dashboard" style="background: #FF6A45; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-weight: bold; display: inline-block;">
          View your applications
        </a>
      </p>
    </div>
  </div>
  `
}
// Interview times are rendered on the server, so they must not depend on the
// server's own timezone — Render runs UTC while the people reading these emails
// are in Ghana. Pinning the zone means the time in the email is always the time
// the employer picked, wherever the API happens to be deployed.
export const DISPLAY_TIME_ZONE = 'Africa/Accra'

export function formatInterviewWhen(date, { withWeekday = false } = {}) {
  return new Date(date).toLocaleString('en-GB', {
    ...(withWeekday ? { weekday: 'long' } : {}),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: DISPLAY_TIME_ZONE,
  })
}

export function interviewEmailTemplate({ name, jobTitle, company, interview }) {
  const when = formatInterviewWhen(interview.scheduledAt, { withWeekday: true })

  // Label the location line for what it actually is, so a meeting link isn't
  // captioned "Location" and an address isn't captioned "Link"
  const detailsLabel =
    interview.mode === 'Video' ? 'Joining link' : interview.mode === 'Phone' ? 'They will call' : 'Location'

  // "Video" alone doesn't tell someone what to install or open
  const format = interview.mode === 'Video' && interview.platform
    ? `${interview.platform} (video)`
    : interview.mode

  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #16232B;">
    <div style="background: #004F6D; padding: 20px 24px; border-radius: 10px 10px 0 0;">
      <span style="color: #fff; font-size: 20px; font-weight: bold;">NextLeap</span>
    </div>
    <div style="background: #ffffff; border: 1px solid #E2E9EB; border-top: none; border-radius: 0 0 10px 10px; padding: 32px 24px;">
      <h2 style="margin: 0 0 16px; font-size: 20px; color: #1E8E5A;">You've been invited to an interview</h2>
      <p style="line-height: 1.6; color: #5A6D74;">
        Hi ${name}, <strong>${company}</strong> would like to interview you for
        <strong>${jobTitle}</strong>.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
        <tr>
          <td style="padding: 10px 0; color: #8FA1A7; border-bottom: 1px solid #E2E9EB;">When</td>
          <td style="padding: 10px 0; font-weight: bold; border-bottom: 1px solid #E2E9EB;">${when}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #8FA1A7; border-bottom: 1px solid #E2E9EB;">Format</td>
          <td style="padding: 10px 0; font-weight: bold; border-bottom: 1px solid #E2E9EB;">${format}</td>
        </tr>
        ${interview.details ? `
        <tr>
          <td style="padding: 10px 0; color: #8FA1A7; border-bottom: 1px solid #E2E9EB;">${detailsLabel}</td>
          <td style="padding: 10px 0; font-weight: bold; border-bottom: 1px solid #E2E9EB; word-break: break-all;">${interview.details}</td>
        </tr>` : ''}
      </table>

      ${interview.note ? `
      <p style="line-height: 1.6; color: #5A6D74; background: #F4F8F9; padding: 14px 16px; border-radius: 8px;">
        ${interview.note}
      </p>` : ''}

      <p style="text-align: center; margin: 32px 0;">
        <a href="${process.env.CLIENT_URL}/dashboard" style="background: #FF6A45; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-weight: bold; display: inline-block;">
          View in your dashboard
        </a>
      </p>
      <p style="line-height: 1.6; color: #8FA1A7; font-size: 12px;">
        Reply to this email if you need to rearrange.
      </p>
    </div>
  </div>
  `
}

export function passwordResetEmailTemplate({ name, resetUrl }) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #16232B;">
    <div style="background: #004F6D; padding: 20px 24px; border-radius: 10px 10px 0 0;">
      <span style="color: #fff; font-size: 20px; font-weight: bold;">NextLeap</span>
    </div>
    <div style="background: #ffffff; border: 1px solid #E2E9EB; border-top: none; border-radius: 0 0 10px 10px; padding: 32px 24px;">
      <h2 style="margin: 0 0 16px; font-size: 20px;">Reset your password</h2>
      <p style="line-height: 1.6; color: #5A6D74;">
        Hi ${name}, we received a request to reset your NextLeap password. Click the button below to choose a new one.
      </p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background: #FF6A45; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-weight: bold; display: inline-block;">
          Reset password
        </a>
      </p>
      <p style="line-height: 1.6; color: #5A6D74; font-size: 13px;">
        This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password will stay unchanged.
      </p>
      <p style="line-height: 1.6; color: #8FA1A7; font-size: 12px; word-break: break-all;">
        Or paste this link into your browser: ${resetUrl}
      </p>
    </div>
  </div>
  `
}