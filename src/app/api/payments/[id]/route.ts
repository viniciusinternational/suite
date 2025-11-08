import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { paymentWithRelations, serializePayment } from '../utils';

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: paymentWithRelations.include,
    });

    if (!payment) {
      return NextResponse.json(
        { ok: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: serializePayment(payment) });
  } catch (error) {
    console.error('Error fetching payment detail:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to load payment' },
      { status: 500 }
    );
  }
}


