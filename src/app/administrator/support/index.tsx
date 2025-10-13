'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const UserSupport = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Support</h1>
        <p className="text-muted-foreground">
          Assist users with basic queries and password resets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Center</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            User support interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSupport; 