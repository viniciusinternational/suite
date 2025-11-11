import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';

// POST /api/audit-logs/auth - Log authentication events (login/logout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, userSnapshot, ipAddress, userAgent } = body;

    // Validate action
    if (action !== 'USER_LOGIN' && action !== 'USER_LOGOUT') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid action. Must be USER_LOGIN or USER_LOGOUT',
        },
        { status: 400 }
      );
    }

    // Use headers if userSnapshot not provided
    const headers = request.headers;
    const headerInfo = getUserInfoFromHeaders(headers);

    const finalUserId = userId || headerInfo.userId;
    const finalUserSnapshot = userSnapshot || headerInfo.userSnapshot;

    // Create audit log (best-effort)
    const auditLog = await createAuditLog({
      userId: finalUserId || 'system',
      userSnapshot: finalUserSnapshot,
      actionType: action,
      entityType: 'User',
      entityId: finalUserId,
      description: action === 'USER_LOGIN' 
        ? `User logged in: ${finalUserSnapshot.fullName} (${finalUserSnapshot.email})`
        : `User logged out: ${finalUserSnapshot.fullName} (${finalUserSnapshot.email})`,
      previousData: null,
      newData: action === 'USER_LOGIN' ? { userId: finalUserId, email: finalUserSnapshot.email } : null,
      ipAddress: (ipAddress || request.ip) ?? headers.get('x-forwarded-for') ?? undefined,
      userAgent: (userAgent || headers.get('user-agent')) ?? undefined,
      isSuccessful: true,
    });

    return NextResponse.json({
      ok: true,
      data: auditLog,
      message: 'Authentication event logged successfully',
    });
  } catch (error) {
    console.error('Error logging authentication event:', error);
    // Don't fail the request if audit logging fails
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to log authentication event',
      },
      { status: 500 }
    );
  }
}

