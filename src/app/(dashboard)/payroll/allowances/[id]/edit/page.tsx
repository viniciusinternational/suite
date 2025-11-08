'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { AllowanceForm } from '@/components/payroll/allowance-form'
import { useAllowance } from '@/hooks/use-allowances'
import { hasPermission } from '@/lib/permissions'

export default function EditAllowancePage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuthGuard(['edit_payroll'])
  const router = useRouter()
  const [id, setId] = useState<string>('')
  
  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])
  
  const { data: allowance, isLoading } = useAllowance(id)

  const canEdit = user && hasPermission(user, 'edit_payroll')

  if (!user || !canEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to edit allowances.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading allowance...</span>
      </div>
    )
  }

  if (!allowance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Allowance Not Found</h1>
          <p className="text-gray-600 mb-4">The allowance you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/payroll?tab=allowances')}>Back to Allowances</Button>
        </div>
      </div>
    )
  }

  const handleSuccess = () => {
    router.push(`/payroll/allowances/${id}`)
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push(`/payroll/allowances/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Details
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Allowance</h1>
          <p className="text-gray-600 mt-1">Update allowance configuration</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Allowance Details</CardTitle>
          <CardDescription>Update the allowance rule details</CardDescription>
        </CardHeader>
        <CardContent>
          <AllowanceForm allowance={allowance} onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  )
}

