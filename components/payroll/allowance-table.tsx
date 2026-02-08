'use client'

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useAllowances } from '@/hooks/use-allowances'
import { Loader2 } from 'lucide-react'

export function AllowanceTable() {
  const router = useRouter()
  const { data: allowances = [], isLoading } = useAllowances()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading allowances...</span>
      </div>
    )
  }

  if (allowances.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No allowances found. Create your first allowance to get started.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount/Percent</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allowances.map((allowance) => {
            const now = new Date()
            const startDate = allowance.startDate ? new Date(allowance.startDate) : null
            const endDate = allowance.endDate ? new Date(allowance.endDate) : null
            const isActive = allowance.always || (startDate && endDate && now >= startDate && now <= endDate)
            const amountDisplay = allowance.amount
              ? `₦${allowance.amount.toLocaleString()}`
              : allowance.percent
              ? `${allowance.percent}%`
              : 'N/A'

            return (
              <TableRow
                key={allowance.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/payroll/allowances/${allowance.id}`)}
              >
                <TableCell className="font-medium">{allowance.title}</TableCell>
                <TableCell>
                  {allowance.amount ? (
                    <Badge variant="outline">Fixed</Badge>
                  ) : (
                    <Badge variant="outline">Percentage</Badge>
                  )}
                </TableCell>
                <TableCell>{amountDisplay}</TableCell>
                <TableCell>
                  {allowance.global ? (
                    <Badge className="bg-blue-100 text-blue-700">Global</Badge>
                  ) : (
                    <div className="flex flex-col gap-1">
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
                        <Badge variant="outline" className="text-gray-500">None</Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {allowance.always ? (
                    <span className="text-sm text-gray-600">Always</span>
                  ) : startDate && endDate ? (
                    <span className="text-sm text-gray-600">
                      {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">No period</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                    variant="outline"
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

