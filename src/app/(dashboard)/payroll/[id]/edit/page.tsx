'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { usePayroll } from '@/hooks/use-payrolls'
import { PayrollSheet } from '@/components/payroll/payroll-sheet'
import { useCreatePayrollWithTracking } from '@/hooks/use-payrolls'
import { hasPermission } from '@/lib/permissions'
import { useState, useCallback } from 'react'
import type { PayrollSheetEntry } from '@/components/payroll/payroll-sheet'

export default function PayrollEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuthGuard(['edit_payroll'])
  const router = useRouter()
  const [id, setId] = useState<string>('')
  
  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])
  
  const { data: payroll, isLoading } = usePayroll(id)
  const updatePayroll = useCreatePayrollWithTracking()

  const [entries, setEntries] = useState<PayrollSheetEntry[]>([])

  const canEditPayroll = user && hasPermission(user, 'edit_payroll')

  const handleEntriesChange = useCallback((newEntries: PayrollSheetEntry[]) => {
    setEntries(newEntries)
  }, [])

  const handleSave = async () => {
    if (!payroll || entries.length === 0) {
      alert('No payroll data to save.')
      return
    }

    try {
      // Note: This is using the create endpoint - you may want a separate update endpoint
      // For now, we'll need to delete and recreate, or update the API to handle updates
      alert('Edit functionality requires updating the API to support payroll updates. Please use the create endpoint pattern.')
    } catch (error: any) {
      console.error('Error saving payroll:', error)
      alert(error?.response?.data?.error || 'Failed to save payroll')
    }
  }

  if (!user || !canEditPayroll) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to edit payrolls.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading payroll...</span>
      </div>
    )
  }

  if (!payroll) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payroll Not Found</h1>
          <p className="text-gray-600 mb-4">The payroll you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/payroll')}>Back to Payroll</Button>
        </div>
      </div>
    )
  }

  // Populate entries from payroll data
  const initialEntries: PayrollSheetEntry[] =
    payroll.entries?.map((entry) => ({
      userId: entry.userId,
      userName: entry.user?.fullName || '',
      employeeId: entry.user?.employeeId,
      position: entry.user?.position,
      baseSalary: entry.baseSalary,
      appliedDeductions:
        entry.deductionApplications?.map((app) => ({
          deductionId: app.deductionId,
          deductionTitle: app.deduction?.title || 'Unknown',
          sourceAmount: app.sourceAmount,
          calculatedAmount: app.calculatedAmount,
        })) || [],
      appliedAllowances:
        entry.allowanceApplications?.map((app) => ({
          allowanceId: app.allowanceId,
          allowanceTitle: app.allowance?.title || 'Unknown',
          sourceAmount: app.sourceAmount,
          calculatedAmount: app.calculatedAmount,
        })) || [],
      totalDeductions: entry.deductions,
      totalAllowances: entry.allowances,
      netSalary: entry.netSalary,
    })) || []

  if (entries.length === 0 && initialEntries.length > 0) {
    setEntries(initialEntries)
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push(`/payroll/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Payroll</h1>
            <p className="text-gray-600 mt-1">Edit payroll details and calculations</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updatePayroll.isPending || entries.length === 0}>
          {updatePayroll.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {/* Payroll Sheet */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Sheet</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Period: {new Date(payroll.periodYear, payroll.periodMonth - 1).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </CardHeader>
        <CardContent>
          <PayrollSheet
            periodMonth={payroll.periodMonth}
            periodYear={payroll.periodYear}
            onPeriodChange={() => {}} // Period cannot be changed when editing
            onEntriesChange={handleEntriesChange}
          />
        </CardContent>
      </Card>
    </div>
  )
}

