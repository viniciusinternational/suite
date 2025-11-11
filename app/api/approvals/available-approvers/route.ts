import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim()
    const requiredPermission = searchParams.get('permission')?.trim()
    const limitParam = searchParams.get('limit')

    const take = limitParam ? Math.min(Number(limitParam) || 20, 50) : 20

    const whereClause: any = {
      isActive: true,
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (requiredPermission) {
      whereClause.permissions = {
        path: [requiredPermission],
        equals: true,
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        permissions: true,
      },
      orderBy: {
        fullName: 'asc',
      },
      take,
    })

    return NextResponse.json({
      ok: true,
      data: users,
    })
  } catch (error) {
    console.error('Error fetching available approvers:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch approvers',
      },
      { status: 500 }
    )
  }
}


