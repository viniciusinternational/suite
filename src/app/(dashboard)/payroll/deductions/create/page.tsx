'use client'

import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { DeductionForm } from '@/components/payroll/deduction-form'

export default function CreateDeductionPage() {
  const { user } = useAuthGuard(['add_payroll'])
  const router = useRouter()

  if (!user) return null

  const handleSuccess = () => {
    router.push('/payroll?tab=deductions')
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/payroll?tab=deductions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Deductions
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Deduction</h1>
          <p className="text-gray-600 mt-1">Create a new payroll deduction rule</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deduction Details</CardTitle>
          <CardDescription>Configure the deduction rule details</CardDescription>
        </CardHeader>
        <CardContent>
          <DeductionForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  )
}

