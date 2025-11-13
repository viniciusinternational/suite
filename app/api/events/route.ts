import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schemas
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

const eventBodySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  link: z.string().url().optional().or(z.literal('')).optional(),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime().optional(),
  endTime: z
    .string()
    .regex(timeRegex, 'End time must be in HH:mm format')
    .optional(),
  isAllDay: z.boolean().optional(),
  isGlobal: z.boolean().optional(),
  userIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
  unitIds: z.array(z.string()).optional(),
})

const deriveEndDateTime = ({
  start,
  endTime,
  explicitEnd,
  isAllDay,
}: {
  start: Date
  endTime?: string
  explicitEnd?: Date
  isAllDay: boolean
}) => {
  if (isNaN(start.getTime())) {
    throw new Error('Invalid start date')
  }

  if (isAllDay) {
    const end = new Date(start.getTime())
    end.setUTCDate(end.getUTCDate() + 1)
    return end
  }

  if (endTime) {
    const [hours, minutes] = endTime.split(':').map(Number)
    const end = new Date(start.getTime())
    end.setHours(hours, minutes, 0, 0)
    if (end <= start) {
      throw new Error('End time must be after start time')
    }
    if (end.getFullYear() !== start.getFullYear() || end.getMonth() !== start.getMonth() || end.getDate() !== start.getDate()) {
      throw new Error('End time must be on the same day as start time')
    }
    if (end.getTime() - start.getTime() > 24 * 60 * 60 * 1000) {
      throw new Error('Event duration cannot exceed 24 hours')
    }
    return end
  }

  if (explicitEnd) {
    if (isNaN(explicitEnd.getTime())) {
      throw new Error('Invalid end date')
    }
    if (explicitEnd <= start) {
      throw new Error('End must be after start')
    }
    if (explicitEnd.getUTCDate() !== start.getUTCDate()) {
      throw new Error('End must be on the same calendar day as start')
    }
    if (explicitEnd.getTime() - start.getTime() > 24 * 60 * 60 * 1000) {
      throw new Error('Event duration cannot exceed 24 hours')
    }
    return explicitEnd
  }

  throw new Error('End time is required unless event is all-day')
}

const formatEndTime = (start: Date, end: Date, isAllDay: boolean) => {
  if (isAllDay) {
    return '23:59'
  }

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return undefined
  }

    if (end.getFullYear() !== start.getFullYear() || end.getMonth() !== start.getMonth() || end.getDate() !== start.getDate()) {
    return undefined
  }

  const hours = end.getHours().toString().padStart(2, '0')
  const minutes = end.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const normalizeEvent = (event: any) => {
  const start = new Date(event.startDateTime)
  const end = new Date(event.endDateTime)

  return {
    ...event,
    endTime: event.isAllDay ? null : event.endTime ?? formatEndTime(start, end, event.isAllDay),
  }
}

// GET /api/events - list events with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || undefined
    const tag = searchParams.get('tag') || undefined
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const where: any = {}

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (tag) {
      where.tags = { has: tag }
    }

    if (start || end) {
      where.AND = [
        start ? { endDateTime: { gte: new Date(start) } } : {},
        end ? { startDateTime: { lte: new Date(end) } } : {},
      ]
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        users: { select: { id: true, fullName: true, email: true, role: true } },
        departments: { select: { id: true, name: true, code: true } },
        units: { select: { id: true, name: true, departmentId: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { startDateTime: 'asc' },
    })

    return NextResponse.json({ ok: true, data: events.map(normalizeEvent) })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST /api/events - create event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = eventBodySchema.parse(body)

    const start = new Date(data.startDateTime)
    const isAllDay = data.isAllDay ?? false

    let end: Date
    try {
      end = deriveEndDateTime({
        start,
        endTime: data.endTime,
        explicitEnd: data.endDateTime ? new Date(data.endDateTime) : undefined,
        isAllDay,
      })
    } catch (dateError: any) {
      return NextResponse.json(
        { ok: false, error: dateError instanceof Error ? dateError.message : 'Invalid end time' },
        { status: 400 }
      )
    }

    const normalizedEndTime =
      isAllDay ? null : data.endTime ?? formatEndTime(start, end, false) ?? undefined

    if (!isAllDay && !normalizedEndTime) {
      return NextResponse.json(
        { ok: false, error: 'End time could not be determined' },
        { status: 400 }
      )
    }

    const normalizeIdentifiers = (inputs: string[]) =>
      inputs.map((input) => input.trim()).filter((input) => input.length > 0)

    const resolveUserIdentifiers = async (inputs: string[]) => {
      const normalized = normalizeIdentifiers(inputs)
      if (!normalized.length) {
        return { resolvedIds: [] as string[], missingInputs: [] as string[] }
      }

      const emails = normalized.filter((input) => input.includes('@'))
      const possibleIds = normalized.filter((input) => !input.includes('@'))

      const userQueries: Promise<Array<{ id: string; email: string }>>[] = []

      if (emails.length) {
        userQueries.push(
          prisma.user.findMany({
            where: { email: { in: emails } },
            select: { id: true, email: true },
          })
        )
      }

      if (possibleIds.length) {
        userQueries.push(
          prisma.user.findMany({
            where: { id: { in: possibleIds } },
            select: { id: true, email: true },
          })
        )
      }

      const foundUsers = (await Promise.all(userQueries)).flat()
      const resolvedIds = Array.from(new Set(foundUsers.map((user) => user.id)))
      const foundEmails = new Set(foundUsers.map((user) => user.email))
      const foundIds = new Set(foundUsers.map((user) => user.id))

      const missingInputs = normalized.filter((input) => {
        if (input.includes('@')) {
          return !foundEmails.has(input)
        }
        return !foundIds.has(input)
      })

      return { resolvedIds, missingInputs }
    }

    const resolveDepartmentIdentifiers = async (inputs: string[]) => {
      const normalized = normalizeIdentifiers(inputs)
      if (!normalized.length) {
        return {
          resolvedIds: [] as string[],
          missingInputs: [] as string[],
          departmentsByCode: new Map<string, { id: string; code: string }>(),
        }
      }

      const departmentQueries: Promise<Array<{ id: string; code: string; name: string }>>[] = [
        prisma.department.findMany({
          where: { code: { in: normalized } },
          select: { id: true, code: true, name: true },
        }),
        prisma.department.findMany({
          where: { name: { in: normalized } },
          select: { id: true, code: true, name: true },
        }),
      ]

      if (normalized.some((input) => input.startsWith('c'))) {
        departmentQueries.push(
          prisma.department.findMany({
            where: { id: { in: normalized } },
            select: { id: true, code: true, name: true },
          })
        )
      }

      const departmentResults = (await Promise.all(departmentQueries)).flat()
      const uniqueDepartments = Array.from(
        new Map(departmentResults.map((dept) => [dept.id, dept])).values()
      )

      const foundCodes = new Set(uniqueDepartments.map((dept) => dept.code))
      const foundNames = new Set(uniqueDepartments.map((dept) => dept.name))
      const foundIds = new Set(uniqueDepartments.map((dept) => dept.id))

      const missingInputs = normalized.filter(
        (input) => !foundCodes.has(input) && !foundNames.has(input) && !foundIds.has(input)
      )

      const departmentsByCode = new Map(
        uniqueDepartments.map((dept) => [dept.code, { id: dept.id, code: dept.code }])
      )

      return {
        resolvedIds: uniqueDepartments.map((dept) => dept.id),
        missingInputs,
        departmentsByCode,
      }
    }

    const resolveUnitIdentifiers = async (
      inputs: string[],
      departmentsByCode: Map<string, { id: string; code: string }>
    ) => {
      const normalized = normalizeIdentifiers(inputs)
      if (!normalized.length) {
        return { resolvedIds: [] as string[], missingInputs: [] as string[] }
      }

      const directInputs = normalized.filter((input) => !input.includes(':'))
      const comboInputs = normalized.filter((input) => input.includes(':'))

      const directInputSet = new Set(directInputs)

      const unitQueries: Promise<Array<{ id: string; name: string; departmentId: string }>>[] = []

      if (directInputs.length) {
        unitQueries.push(
          prisma.departmentUnit.findMany({
            where: { id: { in: directInputs } },
            select: { id: true, name: true, departmentId: true },
          })
        )
        unitQueries.push(
          prisma.departmentUnit.findMany({
            where: { name: { in: directInputs } },
            select: { id: true, name: true, departmentId: true },
          })
        )
      }

      const directResults = (await Promise.all(unitQueries)).flat()
      const matchedInputs = new Set<string>()
      const resolvedUnitIds = new Set<string>()

      directResults.forEach((unit) => {
        resolvedUnitIds.add(unit.id)
        if (directInputSet.has(unit.id)) {
          matchedInputs.add(unit.id)
        }
        if (directInputSet.has(unit.name)) {
          matchedInputs.add(unit.name)
        }
      })

      if (comboInputs.length) {
        const parsedCombos = comboInputs
          .map((input) => {
            const [deptCodeRaw, unitNameRaw] = input.split(':')
            const deptCode = deptCodeRaw?.trim()
            const unitName = unitNameRaw?.trim()
            if (!deptCode || !unitName) {
              return null
            }
            return { input, deptCode, unitName }
          })
          .filter(Boolean) as Array<{ input: string; deptCode: string; unitName: string }>

        if (parsedCombos.length) {
          const codesToFetch = parsedCombos
            .filter((combo) => !departmentsByCode.has(combo.deptCode))
            .map((combo) => combo.deptCode)

          if (codesToFetch.length) {
            const fetchedDepartments = await prisma.department.findMany({
              where: { code: { in: codesToFetch } },
              select: { id: true, code: true },
            })
            fetchedDepartments.forEach((dept) => {
              if (!departmentsByCode.has(dept.code)) {
                departmentsByCode.set(dept.code, { id: dept.id, code: dept.code })
              }
            })
          }

          const combosWithDepartment = parsedCombos
            .map((combo) => {
              const department = departmentsByCode.get(combo.deptCode)
              if (!department) {
                return null
              }
              return { ...combo, departmentId: department.id }
            })
            .filter(Boolean) as Array<{ input: string; deptCode: string; unitName: string; departmentId: string }>

          if (combosWithDepartment.length) {
            const comboUnits = await prisma.departmentUnit.findMany({
              where: {
                OR: combosWithDepartment.map(({ departmentId, unitName }) => ({
                  departmentId,
                  name: unitName,
                })),
              },
              select: { id: true, name: true, departmentId: true },
            })

            combosWithDepartment.forEach((combo) => {
              const matchingUnit = comboUnits.find(
                (unit) => unit.departmentId === combo.departmentId && unit.name === combo.unitName
              )
              if (matchingUnit) {
                resolvedUnitIds.add(matchingUnit.id)
                matchedInputs.add(combo.input)
              }
            })
          }
        }
      }

      const missingInputs = normalized.filter((input) => !matchedInputs.has(input))

      return { resolvedIds: Array.from(resolvedUnitIds), missingInputs }
    }

    const headers = request.headers
    const actorUserId = headers.get('x-user-id')?.trim() || undefined

    const rawUserInputs = data.userIds ?? []
    const rawDepartmentInputs = data.departmentIds ?? []
    const rawUnitInputs = data.unitIds ?? []

    const [{ resolvedIds: resolvedUserIds, missingInputs: unresolvedUsers }, departmentResolution] =
      await Promise.all([
        resolveUserIdentifiers(rawUserInputs),
        resolveDepartmentIdentifiers(rawDepartmentInputs),
      ])

    const { resolvedIds: resolvedDepartmentIds, missingInputs: unresolvedDepartments, departmentsByCode } =
      departmentResolution

    const { resolvedIds: resolvedUnitIds, missingInputs: unresolvedUnits } = await resolveUnitIdentifiers(
      rawUnitInputs,
      departmentsByCode
    )

    if (unresolvedUsers.length || unresolvedDepartments.length || unresolvedUnits.length) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Unable to resolve related records',
          details: {
            missingUsers: unresolvedUsers,
            missingDepartments: unresolvedDepartments,
            missingUnits: unresolvedUnits,
          },
        },
        { status: 400 }
      )
    }

    const created = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        tags: data.tags ?? [],
        link: data.link || undefined,
        startDateTime: start,
        endDateTime: end,
        endTime: normalizedEndTime ?? null,
        isAllDay,
        isGlobal: data.isGlobal ?? false,
        createdById: actorUserId,
        users: resolvedUserIds.length ? { connect: resolvedUserIds.map((id) => ({ id })) } : undefined,
        departments: resolvedDepartmentIds.length
          ? { connect: resolvedDepartmentIds.map((id) => ({ id })) }
          : undefined,
        units: resolvedUnitIds.length ? { connect: resolvedUnitIds.map((id) => ({ id })) } : undefined,
      },
      include: {
        users: { select: { id: true, fullName: true, email: true, role: true } },
        departments: { select: { id: true, name: true, code: true } },
        units: { select: { id: true, name: true, departmentId: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    })

    // Audit log (best-effort)
    try {
      const userId = headers.get('x-user-id') || ''
      const userSnapshot = {
        id: userId,
        fullName: headers.get('x-user-fullname') || 'Unknown',
        email: headers.get('x-user-email') || 'unknown@example.com',
        role: headers.get('x-user-role') || 'unknown',
        departmentId: headers.get('x-user-department-id') || undefined,
      }
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'CREATE',
        entityType: 'Event',
        entityId: created.id,
        description: `Created ${created.isGlobal ? 'global ' : ''}${created.isAllDay ? 'all-day ' : ''}event "${created.title}" with ${created.users.length} users, ${created.departments.length} departments, ${created.units.length} units`,
        previousData: null,
        newData: created as any,
        ipAddress: headers.get('x-forwarded-for') ?? headers.get('x-real-ip') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.log(` error: ${message}`)
      console.warn('Audit log failed (create event):', e)
    }

    const responseData = normalizeEvent({
      ...created,
      endTime: normalizedEndTime ?? null,
    })

    return NextResponse.json({ ok: true, data: responseData, message: 'Event created successfully' })
  } catch (error) {
    console.log(` error: ${error}`)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating event:', error)
    return NextResponse.json({ ok: false, error: 'Failed to create event' }, { status: 500 })
  }
}


