export async function sendPasswordResetEmail(to: string, resetLink: string, name: string) {
  const from = process.env.SMTP_FROM || 'SiteAnalyzer Pro <noreply@siteanalyzerpro.com>';

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`[DEV] Password reset email for ${to}`);
    console.log(`[DEV] Reset link: ${resetLink}`);
    return;
  }

  // Dynamic import keeps nodemailer out of the startup module graph
  // so a missing package won't crash the server before routes are registered
  const nodemailer = (await import('nodemailer')).default;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from,
    to,
    subject: 'Reset your SiteAnalyzer Pro password',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">SiteAnalyzer Pro</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Reset your password</p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Hi ${name ? name.split(' ')[0] : 'there'}, we received a request to reset your SiteAnalyzer Pro password.
                Click the button below to choose a new one.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="background:#2563eb;border-radius:10px;">
                    <a href="${resetLink}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                      Reset my password →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;line-height:1.6;">
                This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
              </p>
              <p style="margin:16px 0 0;font-size:12px;color:#d1d5db;word-break:break-all;">
                Or copy this link: ${resetLink}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} SiteAnalyzer Pro · You're receiving this because you requested a password reset.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: `Reset your SiteAnalyzer Pro password\n\nHi ${name ? name.split(' ')[0] : 'there'},\n\nClick the link below to reset your password (expires in 1 hour):\n\n${resetLink}\n\nIf you didn't request this, ignore this email.\n\n— SiteAnalyzer Pro`,
  });
}
