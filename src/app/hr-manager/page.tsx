import { redirect } from 'next/navigation';

export default function HRManagerPage() {
  // Redirect to the HR Manager dashboard
  redirect('/hr-manager/dashboard');
}

