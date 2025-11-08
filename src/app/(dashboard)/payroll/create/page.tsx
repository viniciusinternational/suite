'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { PayrollSheet, type PayrollSheetEntry } from '@/components/payroll/payroll-sheet'
import { useCreatePayrollWithTracking } from '@/hooks/use-payrolls'
import { hasPermission } from '@/lib/permissions'

export default function CreatePayrollPage() {
  const { user } = useAuthGuard(['add_payroll'])
  const router = useRouter()
  const createPayroll = useCreatePayrollWithTracking()

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const [periodMonth, setPeriodMonth] = useState<number>(currentMonth)
  const [periodYear, setPeriodYear] = useState<number>(currentYear)
  const [entries, setEntries] = useState<PayrollSheetEntry[]>([])

  const canAddPayroll = user && hasPermission(user, 'add_payroll')

  const handleEntriesChange = useCallback((newEntries: PayrollSheetEntry[]) => {
    setEntries(newEntries)
  }, [])

  const handleSave = async () => {
    if (entries.length === 0) {
      alert('No employees found. Please add employees first.')
      return
    }

    try {
      const payload = {
        periodMonth,
        periodYear,
        entries: entries.map((entry) => ({
          userId: entry.userId,
          baseSalary: entry.baseSalary,
          deductions: entry.totalDeductions,
          allowances: entry.totalAllowances,
          deductionApplications: entry.appliedDeductions.map((d) => ({
            deductionId: d.deductionId,
            sourceAmount: d.sourceAmount,
            calculatedAmount: d.calculatedAmount,
          })),
          allowanceApplications: entry.appliedAllowances.map((a) => ({
            allowanceId: a.allowanceId,
            sourceAmount: a.sourceAmount,
            calculatedAmount: a.calculatedAmount,
          })),
        })),
      }

      await createPayroll.mutateAsync(payload)
      router.push('/payroll')
    } catch (error: any) {
      console.error('Error saving payroll:', error)
      alert(error?.response?.data?.error || 'Failed to save payroll')
    }
  }

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

  if (!user || !canAddPayroll) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to create payrolls.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/payroll')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payroll
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Payroll</h1>
            <p className="text-gray-600 mt-1">Create a new payroll for the selected period</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={createPayroll.isPending || entries.length === 0}
          size="lg"
        >
          {createPayroll.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Payroll
            </>
          )}
        </Button>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="periodMonth">Month</Label>
              <Select
                value={String(periodMonth)}
                onValueChange={(value) => setPeriodMonth(parseInt(value))}
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
        </CardContent>
      </Card>

      {/* Payroll Sheet */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Sheet</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Deductions and allowances are automatically calculated based on active rules. You can
            adjust base salaries as needed.
          </p>
        </CardHeader>
        <CardContent>
          <PayrollSheet
            periodMonth={periodMonth}
            periodYear={periodYear}
            onPeriodChange={(month, year) => {
              setPeriodMonth(month)
              setPeriodYear(year)
            }}
            onEntriesChange={handleEntriesChange}
          />
        </CardContent>
      </Card>
    </div>
  )
}

