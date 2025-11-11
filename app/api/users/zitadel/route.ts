import { NextRequest, NextResponse } from 'next/server';
import type { ZitadelUser } from '@/types';

// API Response Types
interface AuthAPIUser {
  userId: string;
  username: string;
  state: string;
  human?: {
    profile?: {
      givenName?: string;
      familyName?: string;
      displayName?: string;
    };
    email?: {
      email: string;
    };
  };
}

interface AuthAPIResponse {
  ok: boolean;
  data: {
    result: AuthAPIUser[];
  };
}

// GET /api/users/zitadel - Fetch users from auth API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Fetch users from auth API
    const response = await fetch('https://auth.viniciusint.com/api/v1/zitadel/auth/user');
    
    if (!response.ok) {
      throw new Error('Failed to fetch users from auth API');
    }

    const data: AuthAPIResponse = await response.json();

    if (!data.ok || !data.data?.result) {
      throw new Error('Invalid response from auth API');
    }

    // Transform API response to ZitadelUser format
    let users: ZitadelUser[] = data.data.result
      .filter(user => user.human) // Only human users
      .map((user): ZitadelUser => {
        const human = user.human!;
        const profile = human.profile || {};
        const email = human.email || { email: '' };

        return {
          id: user.userId,
          email: email.email,
          firstName: profile.givenName || '',
          lastName: profile.familyName || '',
          displayName: profile.displayName || `${profile.givenName || ''} ${profile.familyName || ''}`.trim() || user.username,
          preferredUsername: user.username,
          state: user.state,
        };
      });

    // Client-side search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.displayName.toLowerCase().includes(searchLower) ||
        user.preferredUsername?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      ok: true,
      data: users,
    });
  } catch (error: any) {
    console.error('Error fetching users from auth API:', error);

    return NextResponse.json(
      {
        ok: false,
        error: error.message || 'Failed to fetch users',
      },
      { status: 500 }
    );
  }
}
