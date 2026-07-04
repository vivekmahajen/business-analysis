import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && fromNumber &&
    accountSid !== 'placeholder' && authToken !== 'placeholder');
}

export async function sendSms(to: string, body: string): Promise<void> {
  if (!isTwilioConfigured()) {
    console.log(`[SMS dev] To: ${to} | ${body}`);
    return;
  }
  const client = twilio(accountSid, authToken);
  await client.messages.create({ body, from: fromNumber!, to });
}
