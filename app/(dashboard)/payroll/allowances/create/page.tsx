'use client'

import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { AllowanceForm } from '@/components/payroll/allowance-form'

export default function CreateAllowancePage() {
  const { user } = useAuthGuard(['add_payroll'])
  const router = useRouter()

  if (!user) return null

  const handleSuccess = () => {
    router.push('/payroll?tab=allowances')
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/payroll?tab=allowances')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Allowances
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Allowance</h1>
          <p className="text-gray-600 mt-1">Create a new payroll allowance rule</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Allowance Details</CardTitle>
          <CardDescription>Configure the allowance rule details</CardDescription>
        </CardHeader>
        <CardContent>
          <AllowanceForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  )
}

