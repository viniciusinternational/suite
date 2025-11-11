'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Payroll } from '@/types'

interface PayrollDetailProps {
  payroll: Payroll
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  pending_dept_head: 'bg-yellow-100 text-yellow-700',
  pending_admin_head: 'bg-orange-100 text-orange-700',
  pending_accountant: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  processed: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending_dept_head: 'Pending Dept Head',
  pending_admin_head: 'Pending Admin Head',
  pending_accountant: 'Pending Accountant',
  approved: 'Approved',
  rejected: 'Rejected',
  processed: 'Processed',
  paid: 'Paid',
}

export function PayrollDetail({ payroll }: PayrollDetailProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)
  }

  const periodLabel = `${monthNames[payroll.periodMonth - 1]} ${payroll.periodYear}`
  const entries = payroll.entries || []
  const totalAmount = entries.reduce((sum, entry) => sum + entry.netSalary, 0)
  const totalDeductions = entries.reduce((sum, entry) => sum + entry.deductions, 0)
  const totalAllowances = entries.reduce((sum, entry) => sum + entry.allowances, 0)
  const totalBaseSalary = entries.reduce((sum, entry) => sum + entry.baseSalary, 0)

  const statusColor = statusColors[payroll.status as keyof typeof statusColors] || statusColors.draft
  const statusLabel = statusLabels[payroll.status] || payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1).replace(/_/g, ' ')

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payroll Details</CardTitle>
              <CardDescription>Payroll information for {periodLabel}</CardDescription>
            </div>
            <Badge className={statusColor} variant="outline">
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Period</div>
              <div className="text-lg font-semibold">{periodLabel}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Employees</div>
              <div className="text-lg font-semibold">{entries.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Created</div>
              <div className="text-lg font-semibold">
                {new Date(payroll.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Last Updated</div>
              <div className="text-lg font-semibold">
                {new Date(payroll.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="text-xl font-bold">{formatCurrency(totalAmount)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Entries</CardTitle>
          <CardDescription>Individual payroll entries for each employee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Base Salary</TableHead>
                  <TableHead>Applied Deductions</TableHead>
                  <TableHead>Applied Allowances</TableHead>
                  <TableHead className="text-right">Total Ded.</TableHead>
                  <TableHead className="text-right">Total All.</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{entry.user?.fullName || 'Unknown'}</div>
                        {entry.user?.employeeId && (
                          <div className="text-xs text-gray-500">ID: {entry.user.employeeId}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.baseSalary)}</TableCell>
                    <TableCell>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {entry.deductionApplications && entry.deductionApplications.length > 0 ? (
                          entry.deductionApplications.map((app) => (
                            <div key={app.id} className="text-xs">
                              <span className="text-gray-600">
                                {app.deduction?.title || 'Unknown'}:
                              </span>{' '}
                              <span className="text-red-600 font-medium">
                                {formatCurrency(app.calculatedAmount)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {entry.allowanceApplications && entry.allowanceApplications.length > 0 ? (
                          entry.allowanceApplications.map((app) => (
                            <div key={app.id} className="text-xs">
                              <span className="text-gray-600">
                                {app.allowance?.title || 'Unknown'}:
                              </span>{' '}
                              <span className="text-green-600 font-medium">
                                {formatCurrency(app.calculatedAmount)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      {formatCurrency(entry.deductions)}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {formatCurrency(entry.allowances)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(entry.netSalary)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

