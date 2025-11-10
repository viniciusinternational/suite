'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUsers } from '@/hooks/use-users'
import { useDeductions } from '@/hooks/use-deductions'
import { useAllowances } from '@/hooks/use-allowances'
import { Loader2 } from 'lucide-react'
import type { User, Deduction, Allowance } from '@/types'

interface PayrollSheetProps {
  periodMonth: number
  periodYear: number
  onPeriodChange: (month: number, year: number) => void
  onEntriesChange: (entries: PayrollSheetEntry[]) => void
}

export interface PayrollSheetEntry {
  userId: string
  userName: string
  employeeId?: string
  position?: string
  baseSalary: number
  appliedDeductions: Array<{
    deductionId: string
    deductionTitle: string
    sourceAmount: number
    calculatedAmount: number
  }>
  appliedAllowances: Array<{
    allowanceId: string
    allowanceTitle: string
    sourceAmount: number
    calculatedAmount: number
  }>
  totalDeductions: number
  totalAllowances: number
  netSalary: number
}

export function PayrollSheet({
  periodMonth,
  periodYear,
  onPeriodChange,
  onEntriesChange,
}: PayrollSheetProps) {
  const [entries, setEntries] = useState<PayrollSheetEntry[]>([])
  const [isCalculating, setIsCalculating] = useState(false)

  // Fetch data
  const { data: users = [], isLoading: usersLoading } = useUsers({ status: 'active', includeInactive: false })
  const { data: deductions = [], isLoading: deductionsLoading } = useDeductions({ active: true })
  const { data: allowances = [], isLoading: allowancesLoading } = useAllowances({ active: true })

  // Calculate applicable deductions/allowances for a user
  const calculateApplicableItems = (
    user: User,
    periodDate: Date,
    items: (Deduction | Allowance)[]
  ) => {
    return items.filter((item) => {
      // Check if global
      if (item.global) {
        // Check date range for global items
        if (!item.always) {
          if (item.startDate && new Date(item.startDate) > periodDate) return false
          if (item.endDate && new Date(item.endDate) < periodDate) return false
        }
        return true
      }

      // Check if user is directly assigned
      const isDirectlyAssigned = item.users?.some((u) => u.id === user.id) ?? false

      // Check if user belongs to any assigned department
      const isInAssignedDepartment = item.departments?.some((d) => d.id === user.departmentId) ?? false

      // Apply if user is directly assigned OR in an assigned department
      const appliesToUser = isDirectlyAssigned || isInAssignedDepartment
      if (!appliesToUser) return false

      // Check date range
      if (!item.always) {
        if (item.startDate && new Date(item.startDate) > periodDate) return false
        if (item.endDate && new Date(item.endDate) < periodDate) return false
      }

      return true
    })
  }

  // Calculate amount for a deduction/allowance
  const calculateAmount = (item: Deduction | Allowance, baseSalary: number): number => {
    // Prioritize fixed amount over percentage
    if (item.amount !== null && item.amount !== undefined) {
      return item.amount
    }
    if (item.percent !== null && item.percent !== undefined) {
      return (baseSalary * item.percent) / 100
    }
    return 0
  }

  // Auto-calculate entries when data changes
  useEffect(() => {
    if (usersLoading || deductionsLoading || allowancesLoading || users.length === 0) {
      return
    }

    setIsCalculating(true)
    const periodDate = new Date(periodYear, periodMonth - 1, 15) // Middle of the month

    const newEntries: PayrollSheetEntry[] = users
      .filter((user) => user.isActive)
      .map((user) => {
        const baseSalary = user.salary || 0

        // Get applicable deductions
        const applicableDeductions = calculateApplicableItems(user, periodDate, deductions)
        const appliedDeductions = applicableDeductions.map((deduction) => {
          const sourceAmount = baseSalary
          const calculatedAmount = calculateAmount(deduction, baseSalary)
          return {
            deductionId: deduction.id,
            deductionTitle: deduction.title,
            sourceAmount,
            calculatedAmount,
          }
        })

        // Get applicable allowances
        const applicableAllowances = calculateApplicableItems(user, periodDate, allowances)
        const appliedAllowances = applicableAllowances.map((allowance) => {
          const sourceAmount = baseSalary
          const calculatedAmount = calculateAmount(allowance, baseSalary)
          return {
            allowanceId: allowance.id,
            allowanceTitle: allowance.title,
            sourceAmount,
            calculatedAmount,
          }
        })

        const totalDeductions = appliedDeductions.reduce((sum, d) => sum + d.calculatedAmount, 0)
        const totalAllowances = appliedAllowances.reduce((sum, a) => sum + a.calculatedAmount, 0)
        const netSalary = baseSalary + totalAllowances - totalDeductions

        return {
          userId: user.id,
          userName: user.fullName,
          employeeId: user.employeeId,
          position: user.position,
          baseSalary,
          appliedDeductions,
          appliedAllowances,
          totalDeductions,
          totalAllowances,
          netSalary,
        }
      })

    setEntries(newEntries)
    onEntriesChange(newEntries)
    setIsCalculating(false)
  }, [users, deductions, allowances, periodMonth, periodYear, usersLoading, deductionsLoading, allowancesLoading, onEntriesChange])

  const updateBaseSalary = (userId: string, newSalary: number) => {
    setEntries((prev) => {
      const updated = prev.map((entry) => {
        if (entry.userId !== userId) return entry

        const newBaseSalary = newSalary

        // Recalculate deductions and allowances with new base salary
        const updatedDeductions = entry.appliedDeductions.map((d) => {
          const deduction = deductions.find((ded) => ded.id === d.deductionId)
          if (!deduction) return d
          const calculatedAmount = calculateAmount(deduction, newBaseSalary)
          return {
            ...d,
            sourceAmount: newBaseSalary,
            calculatedAmount,
          }
        })

        const updatedAllowances = entry.appliedAllowances.map((a) => {
          const allowance = allowances.find((all) => all.id === a.allowanceId)
          if (!allowance) return a
          const calculatedAmount = calculateAmount(allowance, newBaseSalary)
          return {
            ...a,
            sourceAmount: newBaseSalary,
            calculatedAmount,
          }
        })

        const totalDeductions = updatedDeductions.reduce((sum, d) => sum + d.calculatedAmount, 0)
        const totalAllowances = updatedAllowances.reduce((sum, a) => sum + a.calculatedAmount, 0)
        const netSalary = newBaseSalary + totalAllowances - totalDeductions

        return {
          ...entry,
          baseSalary: newBaseSalary,
          appliedDeductions: updatedDeductions,
          appliedAllowances: updatedAllowances,
          totalDeductions,
          totalAllowances,
          netSalary,
        }
      })

      onEntriesChange(updated)
      return updated
    })
  }

  const totalNetSalary = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.netSalary, 0),
    [entries]
  )

  const totalBaseSalary = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.baseSalary, 0),
    [entries]
  )

  const totalDeductions = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.totalDeductions, 0),
    [entries]
  )

  const totalAllowances = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.totalAllowances, 0),
    [entries]
  )

  const monthOptions = useMemo(
    () => [
      { value: 1, label: 'January' },
      { value: 2, label: 'February' },
      { value: 3, label: 'March' },
      { value: 4, label: 'April' },
      { value: 5, label: 'May' },
      { value: 6, label: 'June' },
      { value: 7, label: 'July' },
      { value: 8, label: 'August' },
      { value: 9, label: 'September' },
      { value: 10, label: 'October' },
      { value: 11, label: 'November' },
      { value: 12, label: 'December' },
    ],
    []
  )

  const yearOptions = useMemo(() => {
    const startYear = periodYear - 2
    return Array.from({ length: 5 }, (_, i) => startYear + i)
  }, [periodYear])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)
  }

  if (usersLoading || deductionsLoading || allowancesLoading || isCalculating) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading payroll data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
          <div className="flex flex-col gap-1">
            <Label>Month</Label>
            <Select
              value={String(periodMonth)}
              onValueChange={(value) => onPeriodChange(Number(value), periodYear)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={String(month.value)}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Year</Label>
            <Select
              value={String(periodYear)}
              onValueChange={(value) => onPeriodChange(periodMonth, Number(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Showing payroll for {monthOptions.find((m) => m.value === periodMonth)?.label}{' '}
          {periodYear}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-sm text-gray-600">Total Base Salary</div>
          <div className="text-xl font-bold">{formatCurrency(totalBaseSalary)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Allowances</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(totalAllowances)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Deductions</div>
          <div className="text-xl font-bold text-red-600">{formatCurrency(totalDeductions)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Net Pay</div>
          <div className="text-xl font-bold">{formatCurrency(totalNetSalary)}</div>
        </div>
      </div>

      {/* Sheet Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="sticky left-0 bg-gray-50 z-10 min-w-[200px]">Employee</TableHead>
              <TableHead className="text-right min-w-[120px]">Base Salary</TableHead>
              <TableHead className="min-w-[200px]">Deductions</TableHead>
              <TableHead className="min-w-[200px]">Allowances</TableHead>
              <TableHead className="text-right min-w-[120px]">Total Ded.</TableHead>
              <TableHead className="text-right min-w-[120px]">Total All.</TableHead>
              <TableHead className="text-right min-w-[120px] font-semibold">Net Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.userId}>
                  <TableCell className="sticky left-0 bg-white z-10">
                    <div>
                      <div className="font-medium">{entry.userName}</div>
                      {entry.employeeId && (
                        <div className="text-xs text-gray-500">ID: {entry.employeeId}</div>
                      )}
                      {entry.position && (
                        <div className="text-xs text-gray-500">{entry.position}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={entry.baseSalary}
                      onChange={(e) =>
                        updateBaseSalary(entry.userId, parseFloat(e.target.value) || 0)
                      }
                      className="text-right w-full"
                      step="0.01"
                      min="0"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {entry.appliedDeductions.length === 0 ? (
                        <span className="text-xs text-gray-400">None</span>
                      ) : (
                        entry.appliedDeductions.map((d) => (
                          <div key={d.deductionId} className="text-xs">
                            <span className="text-gray-600">{d.deductionTitle}:</span>{' '}
                            <span className="text-red-600 font-medium">
                              {formatCurrency(d.calculatedAmount)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {entry.appliedAllowances.length === 0 ? (
                        <span className="text-xs text-gray-400">None</span>
                      ) : (
                        entry.appliedAllowances.map((a) => (
                          <div key={a.allowanceId} className="text-xs">
                            <span className="text-gray-600">{a.allowanceTitle}:</span>{' '}
                            <span className="text-green-600 font-medium">
                              {formatCurrency(a.calculatedAmount)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-red-600 font-medium">
                    {formatCurrency(entry.totalDeductions)}
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {formatCurrency(entry.totalAllowances)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(entry.netSalary)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

