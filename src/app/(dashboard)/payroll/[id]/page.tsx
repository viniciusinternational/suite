'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { usePayroll } from '@/hooks/use-payrolls'
import { PayrollDetail } from '@/components/payroll/payroll-detail'
import { PayrollApproval } from '@/components/payroll/payroll-approval'
import { Loader2 } from 'lucide-react'

export default function PayrollViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuthGuard(['view_payroll'])
  const router = useRouter()
  const [id, setId] = useState<string>('')
  
  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])
  
  const { data: payroll, isLoading } = usePayroll(id)

  if (!user) return null

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
            <h1 className="text-3xl font-bold text-gray-900">Payroll Details</h1>
            <p className="text-gray-600 mt-1">View payroll information and approvals</p>
          </div>
        </div>
      </div>

      {/* Payroll Details */}
      <PayrollDetail payroll={payroll} />

      {/* Approvals Section */}
      <Card>
        <CardHeader>
          <CardTitle>Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <PayrollApproval payroll={payroll} onApprovalChange={() => {}} />
        </CardContent>
      </Card>
    </div>
  )
}

