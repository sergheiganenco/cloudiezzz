import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, requireRole } from '@/lib/auth';
import { sendLeadWelcome } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, phone, formData, formStep } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingLead = await prisma.lead.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingLead) {
      // Update existing lead
      await prisma.lead.update({
        where: { email: normalizedEmail },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          formData: JSON.stringify(formData || {}),
          formStep: formStep || existingLead.formStep,
        },
      });
    } else {
      // Create new lead
      await prisma.lead.create({
        data: {
          email: normalizedEmail,
          name: name || null,
          phone: phone || null,
          formData: JSON.stringify(formData || {}),
          formStep: formStep || 1,
        },
      });

      // Send welcome email to new leads
      try {
        await sendLeadWelcome({
          email: normalizedEmail,
          name: name || undefined,
          formStep: formStep || 1,
        });
      } catch (emailErr) {
        console.error('Failed to send lead welcome email:', emailErr);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lead API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    where: { status: 'active' },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ leads });
}
