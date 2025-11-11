'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { useCreatePayroll, useUpdatePayroll } from '@/hooks/use-payrolls'
import { useUsers } from '@/hooks/use-users'
import { Loader2 } from 'lucide-react'
import type { Payroll } from '@/types'

interface PayrollFormProps {
  payroll?: Payroll | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface PayrollEntryForm {
  userId: string
  userName: string
  baseSalary: number
  deductions: number
  allowances: number
  netSalary: number
}

export function PayrollForm({ payroll, open, onOpenChange, onSuccess }: PayrollFormProps) {
  const isEditMode = !!payroll
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const [periodMonth, setPeriodMonth] = useState<number>(currentMonth)
  const [periodYear, setPeriodYear] = useState<number>(currentYear)
  const [entries, setEntries] = useState<PayrollEntryForm[]>([])
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false)

  // Fetch active users
  const { data: users = [], isLoading: usersLoading } = useUsers({ status: 'active', includeInactive: false })

  // Mutations
  const createPayroll = useCreatePayroll()
  const updatePayroll = useUpdatePayroll(payroll?.id || '')

  // Initialize form when payroll is provided (edit mode)
  useEffect(() => {
    if (payroll && open) {
      setPeriodMonth(payroll.periodMonth)
      setPeriodYear(payroll.periodYear)
      setEntries(
        (payroll.entries || []).map((entry) => ({
          userId: entry.userId,
          userName: entry.user?.fullName || '',
          baseSalary: entry.baseSalary,
          deductions: entry.deductions,
          allowances: entry.allowances,
          netSalary: entry.netSalary,
        }))
      )
    } else if (!payroll && open) {
      // Reset for new payroll
      setPeriodMonth(currentMonth)
      setPeriodYear(currentYear)
      setEntries([])
    }
  }, [payroll, open, currentMonth, currentYear])

  const loadDefaults = useCallback(async () => {
    setIsLoadingDefaults(true)
    try {
      const newEntries: PayrollEntryForm[] = []

      // Fetch deductions and allowances for each user
      for (const user of users) {
        if (!user.isActive) continue

        // Fetch deductions
        const deductionsResponse = await fetch(`/api/payroll/user-deductions/${user.id}?isActive=true`)
        const deductionsData = deductionsResponse.ok ? await deductionsResponse.json() : { data: [] }
        const totalDeductions = (deductionsData.data || []).reduce(
          (sum: number, d: { amount: number }) => sum + d.amount,
          0
        )

        // Fetch allowances
        const allowancesResponse = await fetch(`/api/payroll/user-allowances/${user.id}?isActive=true`)
        const allowancesData = allowancesResponse.ok ? await allowancesResponse.json() : { data: [] }
        const totalAllowances = (allowancesData.data || []).reduce(
          (sum: number, a: { amount: number }) => sum + a.amount,
          0
        )

        const baseSalary = user.salary || 0
        const netSalary = baseSalary + totalAllowances - totalDeductions

        newEntries.push({
          userId: user.id,
          userName: user.fullName,
          baseSalary,
          deductions: totalDeductions,
          allowances: totalAllowances,
          netSalary,
        })
      }

      setEntries(newEntries)
    } catch (error) {
      console.error('Error loading defaults:', error)
    } finally {
      setIsLoadingDefaults(false)
    }
  }, [users])

  // Auto-populate entries when users are loaded and form is opened (new payroll only)
  useEffect(() => {
    if (!isEditMode && open && users.length > 0 && entries.length === 0 && !isLoadingDefaults) {
      loadDefaults()
    }
  }, [users, open, isEditMode, entries.length, isLoadingDefaults, loadDefaults])

  const updateEntry = (userId: string, field: keyof PayrollEntryForm, value: number) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.userId !== userId) return entry

        const updated = { ...entry, [field]: value }

        // Recalculate net salary when baseSalary, deductions, or allowances change
        if (field === 'baseSalary' || field === 'deductions' || field === 'allowances') {
          updated.netSalary = updated.baseSalary + updated.allowances - updated.deductions
        }

        return updated
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (entries.length === 0) {
      alert('Please add at least one employee to the payroll')
      return
    }

    try {
      const payload = {
        periodMonth,
        periodYear,
        entries: entries.map((entry) => ({
          userId: entry.userId,
          baseSalary: entry.baseSalary,
          deductions: entry.deductions,
          allowances: entry.allowances,
        })),
      }

      if (isEditMode) {
        await updatePayroll.mutateAsync(payload)
      } else {
        await createPayroll.mutateAsync(payload)
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving payroll:', error)
    }
  }

  const totalNetSalary = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.netSalary, 0),
    [entries]
  )

  const months = [
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
  ]

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Payroll' : 'Create Payroll'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update payroll details below.'
              : 'Create a new payroll for the selected period. Deductions and allowances will be auto-populated from user defaults.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Period Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodMonth">Month</Label>
              <Select
                value={String(periodMonth)}
                onValueChange={(value) => setPeriodMonth(parseInt(value))}
                disabled={isEditMode}
              >
                <SelectTrigger id="periodMonth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={String(month.value)}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodYear">Year</Label>
              <Select
                value={String(periodYear)}
                onValueChange={(value) => setPeriodYear(parseInt(value))}
                disabled={isEditMode}
              >
                <SelectTrigger id="periodYear">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payroll Entries Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Payroll Entries</Label>
              {!isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadDefaults}
                  disabled={isLoadingDefaults || usersLoading}
                >
                  {isLoadingDefaults ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Reload Defaults'
                  )}
                </Button>
              )}
            </div>

            {(usersLoading || isLoadingDefaults) && entries.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading employees...</span>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No employees found. Please add employees first.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead className="text-right">Base Salary</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Allowances</TableHead>
                      <TableHead className="text-right">Net Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.userId}>
                        <TableCell className="font-medium">{entry.userName}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.baseSalary}
                            onChange={(e) =>
                              updateEntry(entry.userId, 'baseSalary', parseFloat(e.target.value) || 0)
                            }
                            className="text-right w-32"
                            step="0.01"
                            min="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.deductions}
                            onChange={(e) =>
                              updateEntry(entry.userId, 'deductions', parseFloat(e.target.value) || 0)
                            }
                            className="text-right w-32"
                            step="0.01"
                            min="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.allowances}
                            onChange={(e) =>
                              updateEntry(entry.userId, 'allowances', parseFloat(e.target.value) || 0)
                            }
                            className="text-right w-32"
                            step="0.01"
                            min="0"
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {entry.netSalary.toLocaleString('en-NG', {
                            style: 'currency',
                            currency: 'NGN',
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Total Summary */}
            {entries.length > 0 && (
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right space-y-1">
                  <div className="text-sm text-gray-600">Total Net Pay:</div>
                  <div className="text-2xl font-bold">
                    {totalNetSalary.toLocaleString('en-NG', {
                      style: 'currency',
                      currency: 'NGN',
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPayroll.isPending || updatePayroll.isPending || entries.length === 0}
            >
              {(createPayroll.isPending || updatePayroll.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isEditMode ? 'Update Payroll' : 'Create Payroll'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

