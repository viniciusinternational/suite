'use client';

import { useParams, useRouter, notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useProject } from '@/hooks/use-projects';
import { MilestoneList } from '@/components/project/milestone-list';
import { ProjectInfoCard } from '@/components/project/project-info-card';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function ProjectDetailsPage() {
  useAuthGuard(['view_projects']);
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Milestone List */}
        <div className="lg:col-span-2 space-y-6">
          <MilestoneList projectId={projectId} />
        </div>

        {/* Right Column: Project Info */}
        <div className="lg:col-span-1">
          <ProjectInfoCard project={project} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
