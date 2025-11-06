'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Edit } from 'lucide-react'
import { useAllowance } from '@/hooks/use-allowances'
import { hasPermission } from '@/lib/permissions'

export default function AllowanceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuthGuard(['view_payroll'])
  const router = useRouter()
  const [id, setId] = useState<string>('')
  
  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])
  
  const { data: allowance, isLoading } = useAllowance(id)

  if (!user) return null

  const canEdit = user && hasPermission(user, 'edit_payroll')

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

  const now = new Date()
  const startDate = allowance.startDate ? new Date(allowance.startDate) : null
  const endDate = allowance.endDate ? new Date(allowance.endDate) : null
  const isActive = allowance.always || (startDate && endDate && now >= startDate && now <= endDate)

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/payroll?tab=allowances')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Allowances
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{allowance.title}</h1>
            <p className="text-gray-600 mt-1">Allowance details and configuration</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => router.push(`/payroll/allowances/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-600">Title</div>
              <div className="text-lg font-semibold">{allowance.title}</div>
            </div>
            {allowance.description && (
              <div>
                <div className="text-sm text-gray-600">Description</div>
                <div className="text-base">{allowance.description}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <Badge
                className={isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                variant="outline"
              >
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-600">Type</div>
              <div className="text-base">
                {allowance.amount ? (
                  <Badge variant="outline">Fixed Amount</Badge>
                ) : (
                  <Badge variant="outline">Percentage</Badge>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Amount/Percent</div>
              <div className="text-lg font-semibold">
                {allowance.amount
                  ? `₦${allowance.amount.toLocaleString()}`
                  : allowance.percent
                  ? `${allowance.percent}%`
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Scope</div>
              <div className="text-base">
                {allowance.global ? (
                  <Badge className="bg-blue-100 text-blue-700">Global (All Users)</Badge>
                ) : (
                  <div className="flex flex-col gap-2">
                    {allowance.users && allowance.users.length > 0 && (
                      <Badge variant="outline">
                        {allowance.users.length} user{allowance.users.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {allowance.departments && allowance.departments.length > 0 && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        {allowance.departments.length} dept{allowance.departments.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {(!allowance.users || allowance.users.length === 0) && (!allowance.departments || allowance.departments.length === 0) && (
                      <Badge variant="outline" className="text-gray-500">None assigned</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Period</CardTitle>
          </CardHeader>
          <CardContent>
            {allowance.always ? (
              <div className="text-base">Always active</div>
            ) : startDate && endDate ? (
              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-600">Start Date</div>
                  <div className="text-base">{startDate.toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">End Date</div>
                  <div className="text-base">{endDate.toLocaleDateString()}</div>
                </div>
              </div>
            ) : (
              <div className="text-base text-gray-500">No period set</div>
            )}
          </CardContent>
        </Card>

        {!allowance.global && allowance.departments && allowance.departments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Departments ({allowance.departments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allowance.departments.map((dept) => (
                  <div key={dept.id} className="flex items-center gap-2 py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{dept.name}</div>
                      <div className="text-sm text-gray-600">{dept.code}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!allowance.global && allowance.users && allowance.users.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Users ({allowance.users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allowance.users.map((user) => (
                  <div key={user.id} className="flex items-center gap-2 py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

