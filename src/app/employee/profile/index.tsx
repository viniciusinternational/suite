'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MyProfile = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">My Profile</h1>
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Personal and employment detail access</p></CardContent>
      </Card>
    </div>
  );
};

export default MyProfile; 