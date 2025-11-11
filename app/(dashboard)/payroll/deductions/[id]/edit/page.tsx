'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { DeductionForm } from '@/components/payroll/deduction-form'
import { useDeduction } from '@/hooks/use-deductions'
import { hasPermission } from '@/lib/permissions'

export default function EditDeductionPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuthGuard(['edit_payroll'])
  const router = useRouter()
  const [id, setId] = useState<string>('')
  
  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])
  
  const { data: deduction, isLoading } = useDeduction(id)

  const canEdit = user && hasPermission(user, 'edit_payroll')

  if (!user || !canEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to edit deductions.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading deduction...</span>
      </div>
    )
  }

  if (!deduction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Deduction Not Found</h1>
          <p className="text-gray-600 mb-4">The deduction you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/payroll?tab=deductions')}>Back to Deductions</Button>
        </div>
      </div>
    )
  }

  const handleSuccess = () => {
    router.push(`/payroll/deductions/${id}`)
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push(`/payroll/deductions/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Details
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Deduction</h1>
          <p className="text-gray-600 mt-1">Update deduction configuration</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deduction Details</CardTitle>
          <CardDescription>Update the deduction rule details</CardDescription>
        </CardHeader>
        <CardContent>
          <DeductionForm deduction={deduction} onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  )
}

