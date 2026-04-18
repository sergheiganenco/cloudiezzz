import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || 'Cloudiezzz <hello@cloudiezzz.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions) {
  if (!resend) {
    console.log(`[DEV EMAIL] To: ${options.to} | Subject: ${options.subject}`);
    console.log(options.html.replace(/<[^>]*>/g, '').substring(0, 200));
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

function wrap(body: string): string {
  return `
    <div style="font-family:Fredoka,Nunito,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#faf7f2;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-family:Modak,cursive;font-size:32px;color:#ec4899;">Cloudiezzz</span>
      </div>
      <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        ${body}
      </div>
      <p style="text-align:center;font-size:12px;color:#b5aa9a;margin-top:24px;">
        Custom songs, made with love &mdash; cloudiezzz.com
      </p>
    </div>
  `;
}

// ─── Order confirmation ─────────────────────────────────────────────
export async function sendOrderConfirmation(order: {
  buyerEmail: string;
  buyerName: string;
  orderNumber: string;
  accessToken: string;
  packageId: string;
  totalPrice: number;
  recName: string | null;
}) {
  const trackUrl = `${APP_URL}/order/${order.accessToken}`;

  await sendEmail({
    to: order.buyerEmail,
    subject: `Your Cloudiezzz order ${order.orderNumber} is confirmed!`,
    html: wrap(`
      <h2 style="color:#2a2418;font-size:20px;margin:0 0 16px;">Hey ${order.buyerName}!</h2>
      <p style="color:#5d5346;font-size:15px;line-height:1.6;">
        Your ${order.packageId} song commission${order.recName ? ` for <strong>${order.recName}</strong>` : ''} has been received.
      </p>
      <p style="color:#5d5346;font-size:15px;">
        Order: <strong>${order.orderNumber}</strong><br/>
        Total: <strong>$${(order.totalPrice / 100).toFixed(2)}</strong>
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${trackUrl}" style="display:inline-block;padding:12px 32px;background:#ec4899;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          Track Your Order
        </a>
      </div>
      <p style="color:#8b7e6e;font-size:13px;">
        Bookmark this link to check your order status anytime.
      </p>
    `),
  });
}

// ─── Payment confirmation ───────────────────────────────────────────
export async function sendPaymentConfirmation(order: {
  buyerEmail: string;
  buyerName: string;
  orderNumber: string;
  accessToken: string;
  totalPrice: number;
}) {
  const trackUrl = `${APP_URL}/order/${order.accessToken}`;

  await sendEmail({
    to: order.buyerEmail,
    subject: `Payment received for ${order.orderNumber}`,
    html: wrap(`
      <h2 style="color:#2a2418;font-size:20px;margin:0 0 16px;">Payment confirmed!</h2>
      <p style="color:#5d5346;font-size:15px;line-height:1.6;">
        We've received your payment of <strong>$${(order.totalPrice / 100).toFixed(2)}</strong> for order ${order.orderNumber}.
        Your song is now in the production queue!
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${trackUrl}" style="display:inline-block;padding:12px 32px;background:#ec4899;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          Track Progress
        </a>
      </div>
    `),
  });
}

// ─── Status update ──────────────────────────────────────────────────
export async function sendStatusUpdate(order: {
  buyerEmail: string;
  buyerName: string;
  orderNumber: string;
  accessToken: string;
  newStatus: string;
  note?: string;
}) {
  const trackUrl = `${APP_URL}/order/${order.accessToken}`;

  const statusMessages: Record<string, string> = {
    in_progress: 'Your song is now being created! Our songwriter is working on it.',
    review: 'Your song draft is ready for review. Check it out!',
    revision: 'We\'re working on your requested revisions.',
    completed: 'Your song is complete and ready for delivery!',
    delivered: 'Your song has been delivered! Check your order page to listen.',
  };

  const message = statusMessages[order.newStatus] || `Your order status has been updated to: ${order.newStatus}`;

  await sendEmail({
    to: order.buyerEmail,
    subject: `${order.orderNumber} update: ${order.newStatus.replace('_', ' ')}`,
    html: wrap(`
      <h2 style="color:#2a2418;font-size:20px;margin:0 0 16px;">Order Update</h2>
      <p style="color:#5d5346;font-size:15px;line-height:1.6;">${message}</p>
      ${order.note ? `<p style="color:#8b7e6e;font-size:14px;font-style:italic;">"${order.note}"</p>` : ''}
      <div style="text-align:center;margin:24px 0;">
        <a href="${trackUrl}" style="display:inline-block;padding:12px 32px;background:#ec4899;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          View Order
        </a>
      </div>
    `),
  });
}

// ─── Admin new order alert ─────────────────────────────────────────
export async function sendAdminNewOrderAlert(order: {
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  packageId: string;
  totalPrice: number;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cloudiezzz.com';
  const dashboardUrl = `${APP_URL}/admin/orders`;

  await sendEmail({
    to: adminEmail,
    subject: `New order ${order.orderNumber} from ${order.buyerName}`,
    html: wrap(`
      <h2 style="color:#2a2418;font-size:20px;margin:0 0 16px;">New Order Received</h2>
      <p style="color:#5d5346;font-size:15px;line-height:1.6;">
        <strong>${order.buyerName}</strong> (${order.buyerEmail}) just placed an order.
      </p>
      <p style="color:#5d5346;font-size:15px;">
        Order: <strong>${order.orderNumber}</strong><br/>
        Package: <strong>${order.packageId}</strong><br/>
        Total: <strong>$${(order.totalPrice / 100).toFixed(2)}</strong>
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${dashboardUrl}" style="display:inline-block;padding:12px 32px;background:#ec4899;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          View in Dashboard
        </a>
      </div>
    `),
  });
}

// ─── Message notification ──────────────────────────────────────────
export async function sendMessageNotification(order: {
  buyerEmail: string;
  buyerName: string;
  orderNumber: string;
  accessToken: string;
  messagePreview: string;
}) {
  const trackUrl = `${APP_URL}/order/${order.accessToken}`;

  await sendEmail({
    to: order.buyerEmail,
    subject: `New message on your order ${order.orderNumber}`,
    html: wrap(`
      <h2 style="color:#2a2418;font-size:20px;margin:0 0 16px;">You have a new message</h2>
      <p style="color:#5d5346;font-size:15px;line-height:1.6;">
        Hey ${order.buyerName}, you received a new message regarding order <strong>${order.orderNumber}</strong>:
      </p>
      <div style="background:#faf7f2;border-left:3px solid #ec4899;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <p style="color:#5d5346;font-size:14px;font-style:italic;margin:0;">"${order.messagePreview}"</p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${trackUrl}" style="display:inline-block;padding:12px 32px;background:#ec4899;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          View & Reply
        </a>
      </div>
    `),
  });
}

// ─── Admin alert: new customer message ─────────────────────────────
export async function sendAdminMessageAlert(data: {
  orderNumber: string;
  buyerName: string;
  messagePreview: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cloudiezzz.com';
  const adminUrl = `${APP_URL}/admin`;

  await sendEmail({
    to: adminEmail,
    subject: `New message from ${data.buyerName} on ${data.orderNumber}`,
    html: wrap(`
      <h2 style="color:#2a2418;font-size:20px;margin:0 0 16px;">New Customer Message</h2>
      <p style="color:#5d5346;font-size:15px;line-height:1.6;">
        <strong>${data.buyerName}</strong> sent a message on order <strong>${data.orderNumber}</strong>:
      </p>
      <div style="background:#faf7f2;border-left:3px solid #ec4899;border-radius:8px;padding:12px 16px;margin:16px 0;">
        <p style="color:#5d5346;font-size:14px;font-style:italic;margin:0;">"${data.messagePreview}"</p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${adminUrl}" style="display:inline-block;padding:12px 32px;background:#422006;color:#fef08a;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          View in Dashboard
        </a>
      </div>
    `),
  });
}

// ─── Creator assignment ────────────────────────────────────────────
export async function sendCreatorAssignment(data: {
  creatorEmail: string;
  creatorName: string;
  orderNumber: string;
  packageId: string;
  mood: string | null;
  genres: string | null;
}) {
  const adminUrl = `${APP_URL}/admin`;
  const genreList = data.genres ? JSON.parse(data.genres).join(', ') : 'Not specified';

  await sendEmail({
    to: data.creatorEmail,
    subject: `New assignment: ${data.orderNumber}`,
    html: wrap(`
      <h2 style="color:#2a2418;font-size:20px;margin:0 0 16px;">New Song Assignment</h2>
      <p style="color:#5d5346;font-size:15px;line-height:1.6;">
        Hey ${data.creatorName}, you've been assigned to a new song!
      </p>
      <p style="color:#5d5346;font-size:15px;">
        Order: <strong>${data.orderNumber}</strong><br/>
        Package: <strong>${data.packageId}</strong><br/>
        Mood: <strong>${data.mood || 'Not specified'}</strong><br/>
        Genres: <strong>${genreList}</strong>
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${adminUrl}" style="display:inline-block;padding:12px 32px;background:#7c3aed;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          View in Dashboard
        </a>
      </div>
    `),
  });
}

// ─── Lead welcome ─────────────────────────────────────────────────
export async function sendLeadWelcome(lead: {
  email: string;
  name?: string;
  formStep: number;
}) {
  const formUrl = `${APP_URL}/?resume=true`;
  await sendEmail({
    to: lead.email,
    subject: 'Your Cloudiezzz song is waiting to be created!',
    html: wrap(`
      <h2 style="color:#2a2418;font-size:20px;margin:0 0 16px;">Hey${lead.name ? ` ${lead.name}` : ''}!</h2>
      <p style="color:#5d5346;font-size:15px;line-height:1.6;">
        We noticed you started creating a custom song but didn't finish. No worries — your progress is saved!
        You were on step ${lead.formStep} of 6.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${formUrl}" style="display:inline-block;padding:14px 36px;background:#ec4899;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;">
          Continue Your Song ✿
        </a>
      </div>
      <p style="color:#8b7e6e;font-size:13px;">
        Use code CLOUD25 for 25% off — it's already saved for you.
      </p>
    `),
  });
}

// ─── Lead reminder ────────────────────────────────────────────────
export async function sendLeadReminder(lead: {
  email: string;
  name?: string;
  formStep: number;
  reminderNumber: number;
}) {
  const formUrl = `${APP_URL}/?resume=true`;
  const subjects = [
    'Your custom song is almost ready to start!',
    'Still thinking? Your song details are saved ✿',
    'Don\'t miss out — finish your song order',
    'Last chance to complete your song commission',
    'We\'re holding your spot — complete your song!',
  ];
  const subject = subjects[Math.min(lead.reminderNumber, subjects.length - 1)];

  await sendEmail({
    to: lead.email,
    subject,
    html: wrap(`
      <h2 style="color:#2a2418;font-size:20px;margin:0 0 16px;">Hey${lead.name ? ` ${lead.name}` : ''}!</h2>
      <p style="color:#5d5346;font-size:15px;line-height:1.6;">
        Your custom song order is still waiting! You got to step ${lead.formStep} of 6 — just a few more details and we'll start creating your masterpiece.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${formUrl}" style="display:inline-block;padding:14px 36px;background:#ec4899;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;">
          Continue Where You Left Off ✿
        </a>
      </div>
      <p style="color:#8b7e6e;font-size:13px;">
        Code CLOUD25 gives you 25% off. Don't let this song go unwritten!
      </p>
      <p style="color:#b5aa9a;font-size:11px;margin-top:16px;">
        <a href="${APP_URL}/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color:#b5aa9a;">Unsubscribe from reminders</a>
      </p>
    `),
  });
}

// ─── Delivery with gift link ────────────────────────────────────────
export async function sendDeliveryEmail(order: {
  buyerEmail: string;
  buyerName: string;
  orderNumber: string;
  accessToken: string;
  recName: string | null;
  giftPageSlug: string | null;
}) {
  const trackUrl = `${APP_URL}/order/${order.accessToken}`;
  const giftUrl = order.giftPageSlug ? `${APP_URL}/gift/${order.giftPageSlug}` : null;

  await sendEmail({
    to: order.buyerEmail,
    subject: `Your song is ready! ${order.orderNumber}`,
    html: wrap(`
      <h2 style="color:#2a2418;font-size:20px;margin:0 0 16px;">Your song is ready!</h2>
      <p style="color:#5d5346;font-size:15px;line-height:1.6;">
        ${order.recName ? `The song for <strong>${order.recName}</strong>` : 'Your custom song'} is complete and waiting for you.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${trackUrl}" style="display:inline-block;padding:12px 32px;background:#ec4899;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          Listen & Download
        </a>
      </div>
      ${giftUrl ? `
        <div style="background:#fce7f3;border-radius:12px;padding:16px;margin-top:20px;">
          <p style="color:#ec4899;font-weight:600;font-size:14px;margin:0 0 8px;">Share with your loved one:</p>
          <a href="${giftUrl}" style="color:#ec4899;font-size:13px;word-break:break-all;">${giftUrl}</a>
          <p style="color:#8b7e6e;font-size:12px;margin:8px 0 0;">This special link reveals the song with a beautiful unwrap experience.</p>
        </div>
      ` : ''}
    `),
  });
}
