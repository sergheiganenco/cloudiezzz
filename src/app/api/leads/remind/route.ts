import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendLeadReminder } from '@/lib/email';

export async function POST(request: NextRequest) {
  // Verify cron secret
  const cronSecret = request.headers.get('x-cron-secret');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const leads = await prisma.lead.findMany({
      where: {
        status: 'active',
        remindersSent: { lt: 5 },
        OR: [
          { lastReminderAt: null },
          { lastReminderAt: { lt: twentyFourHoursAgo } },
        ],
      },
    });

    let emailsSent = 0;

    for (const lead of leads) {
      try {
        await sendLeadReminder({
          email: lead.email,
          name: lead.name || undefined,
          formStep: lead.formStep,
          reminderNumber: lead.remindersSent,
        });

        const newReminderCount = lead.remindersSent + 1;

        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            remindersSent: newReminderCount,
            lastReminderAt: new Date(),
            ...(newReminderCount >= 5 && { status: 'expired' }),
          },
        });

        emailsSent++;
      } catch (err) {
        console.error(`Failed to send reminder to ${lead.email}:`, err);
      }
    }

    return NextResponse.json({ success: true, emailsSent });
  } catch (error) {
    console.error('Lead reminder cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
