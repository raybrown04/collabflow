import { Metadata } from "next";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProjectHeader from "@/components/ProjectHeader";
import { DocumentsUi } from "@/components/DocumentsUi";

interface ProjectDocumentsPageProps {
  params: {
    projectId: string;
  };
}

export async function generateMetadata({ params }: ProjectDocumentsPageProps): Promise<Metadata> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {}, // No need to set cookies in metadata function
        remove: () => {} // No need to remove cookies in metadata function
      }
    }
  );
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", params.projectId)
    .single();

  if (!project) {
    return {
      title: "Project Not Found | CollabFlow",
    };
  }

  return {
    title: `${project.name} Documents | CollabFlow`,
    description: `Manage and organize documents for ${project.name}`,
  };
}

export default async function ProjectDocumentsPage({ params }: ProjectDocumentsPageProps) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {}, // Server components can't set cookies
          remove: () => {} // Server components can't remove cookies
        }
      }
    );
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", params.projectId)
      .single();

    if (error) {
      console.error("Error fetching project:", error);
      return (
        <div className="flex flex-col items-center justify-center h-full p-6">
          <h2 className="text-xl font-semibold mb-4">Error Loading Project</h2>
          <p className="text-muted-foreground">
            {error.message || "Failed to load project details"}
          </p>
        </div>
      );
    }

    if (!project) {
      notFound();
    }

    return (
      <div className="flex flex-col flex-1 w-full">
        <ProjectHeader project={project} />
        <div className="px-4 py-6">
          <h2 className="text-xl font-semibold mb-4">Project Documents</h2>
          <p className="text-muted-foreground mb-4">
            Organize and manage documents for {project.name} project. Connect to Dropbox to sync and collaborate.
          </p>
          
          <Suspense fallback={
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-40"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-36 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
          }>
            <DocumentsUi projectId={params.projectId} />
          </Suspense>
        </div>
      </div>
    );
  } catch (err) {
    console.error("Unexpected error in ProjectDocumentsPage:", err);
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <h2 className="text-xl font-semibold mb-4">Something Went Wrong</h2>
        <p className="text-muted-foreground">
          An unexpected error occurred while loading the project documents.
        </p>
      </div>
    );
  }
}
