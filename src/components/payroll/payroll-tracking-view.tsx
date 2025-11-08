'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { usePayrolls } from '@/hooks/use-payrolls'
import { Loader2 } from 'lucide-react'

export function PayrollTrackingView() {
  const [selectedDeductionId, setSelectedDeductionId] = useState<string>('all')
  const [selectedAllowanceId, setSelectedAllowanceId] = useState<string>('all')
  const [selectedPayrollId, setSelectedPayrollId] = useState<string>('all')

  const { data: payrolls = [], isLoading } = usePayrolls()

  // Collect all unique deductions and allowances from payrolls
  const allDeductions = new Map<string, { id: string; title: string }>()
  const allAllowances = new Map<string, { id: string; title: string }>()

  payrolls.forEach((payroll) => {
    payroll.entries?.forEach((entry) => {
      entry.deductionApplications?.forEach((app) => {
        if (app.deduction) {
          allDeductions.set(app.deduction.id, {
            id: app.deduction.id,
            title: app.deduction.title,
          })
        }
      })
      entry.allowanceApplications?.forEach((app) => {
        if (app.allowance) {
          allAllowances.set(app.allowance.id, {
            id: app.allowance.id,
            title: app.allowance.title,
          })
        }
      })
    })
  })

  // Filter applications based on selection
  const filteredApplications: Array<{
    type: 'deduction' | 'allowance'
    id: string
    title: string
    payrollId: string
    payrollPeriod: string
    userId: string
    userName: string
    amount: number
    appliedAt: string
  }> = []

  payrolls.forEach((payroll) => {
    if (selectedPayrollId !== 'all' && payroll.id !== selectedPayrollId) return

    const periodLabel = `${new Date(payroll.periodYear, payroll.periodMonth - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })}`

    payroll.entries?.forEach((entry) => {
      // Deduction applications
      entry.deductionApplications?.forEach((app) => {
        if (selectedDeductionId === 'all' || app.deductionId === selectedDeductionId) {
          if (app.deduction) {
            filteredApplications.push({
              type: 'deduction',
              id: app.id,
              title: app.deduction.title,
              payrollId: payroll.id,
              payrollPeriod: periodLabel,
              userId: entry.userId,
              userName: entry.user?.fullName || 'Unknown',
              amount: app.calculatedAmount,
              appliedAt: app.appliedAt,
            })
          }
        }
      })

      // Allowance applications
      entry.allowanceApplications?.forEach((app) => {
        if (selectedAllowanceId === 'all' || app.allowanceId === selectedAllowanceId) {
          if (app.allowance) {
            filteredApplications.push({
              type: 'allowance',
              id: app.id,
              title: app.allowance.title,
              payrollId: payroll.id,
              payrollPeriod: periodLabel,
              userId: entry.userId,
              userName: entry.user?.fullName || 'Unknown',
              amount: app.calculatedAmount,
              appliedAt: app.appliedAt,
            })
          }
        }
      })
    })
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading tracking data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="deduction-filter">Filter by Deduction</Label>
          <Select value={selectedDeductionId} onValueChange={setSelectedDeductionId}>
            <SelectTrigger id="deduction-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Deductions</SelectItem>
              {Array.from(allDeductions.values()).map((deduction) => (
                <SelectItem key={deduction.id} value={deduction.id}>
                  {deduction.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="allowance-filter">Filter by Allowance</Label>
          <Select value={selectedAllowanceId} onValueChange={setSelectedAllowanceId}>
            <SelectTrigger id="allowance-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Allowances</SelectItem>
              {Array.from(allAllowances.values()).map((allowance) => (
                <SelectItem key={allowance.id} value={allowance.id}>
                  {allowance.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payroll-filter">Filter by Payroll</Label>
          <Select value={selectedPayrollId} onValueChange={setSelectedPayrollId}>
            <SelectTrigger id="payroll-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payrolls</SelectItem>
              {payrolls.map((payroll) => (
                <SelectItem key={payroll.id} value={payroll.id}>
                  {new Date(payroll.periodYear, payroll.periodMonth - 1).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Payroll Period</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Applied At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No applications found matching the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((app) => (
                <TableRow key={`${app.type}-${app.id}`}>
                  <TableCell>
                    <Badge
                      className={
                        app.type === 'deduction'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }
                      variant="outline"
                    >
                      {app.type === 'deduction' ? 'Deduction' : 'Allowance'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{app.title}</TableCell>
                  <TableCell>{app.userName}</TableCell>
                  <TableCell>{app.payrollPeriod}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {app.type === 'deduction' ? (
                      <span className="text-red-600">-{formatCurrency(app.amount)}</span>
                    ) : (
                      <span className="text-green-600">+{formatCurrency(app.amount)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(app.appliedAt).toLocaleDateString()}
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

