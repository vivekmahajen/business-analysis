import crypto from 'crypto';

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || '';
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID || '';
const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX || 'us1';

export interface MailchimpLead {
  email: string;
  firstName?: string;
  businessName?: string;
  analyzedUrl: string;
  overallScore?: number;
  topGap?: string;
  reportId?: string;
}

export async function addToMailchimp(lead: MailchimpLead): Promise<void> {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID) {
    console.log('[mailchimp] Skipping — API key not configured');
    return;
  }
  const subscriberHash = crypto.createHash('md5').update(lead.email.toLowerCase()).digest('hex');
  const baseUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`;
  const auth = Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64');

  // Upsert contact
  const upsertRes = await fetch(`${baseUrl}/lists/${MAILCHIMP_AUDIENCE_ID}/members/${subscriberHash}`, {
    method: 'PUT',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email_address: lead.email,
      status_if_new: 'subscribed',
      merge_fields: {
        FNAME:    lead.firstName || '',
        BIZNAME:  lead.businessName || '',
        ANAURL:   lead.analyzedUrl,
        SCORE:    String(lead.overallScore || ''),
        TOPGAP:   lead.topGap || '',
        REPORTID: lead.reportId || '',
      },
    }),
  });
  if (!upsertRes.ok) {
    const err = await upsertRes.text();
    console.error('[mailchimp] Upsert failed:', err);
    return;
  }

  // Add drip trigger tag
  await fetch(`${baseUrl}/lists/${MAILCHIMP_AUDIENCE_ID}/members/${subscriberHash}/tags`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: [{ name: 'siteanalyzer-lead', status: 'active' }, { name: 'drip-day-0', status: 'active' }] }),
  });
}
