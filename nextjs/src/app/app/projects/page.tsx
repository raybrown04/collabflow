import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
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
  
  // Fetch all projects
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching projects:", error);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Projects</h1>
        <div className="text-red-500">Error loading projects. Please try again later.</div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Suspense fallback={<div>Loading projects...</div>}>
          {projects.length > 0 ? (
            <>
              {projects.map((project) => (
                <Link href={`/app/projects/${project.id}`} key={project.id}>
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-6 h-6 rounded-md"
                          style={{ backgroundColor: project.color }}
                        />
                        <CardTitle>{project.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        {project.description || "No description provided."}
                      </CardDescription>
                    </CardContent>
                    <CardFooter className="flex justify-between text-sm text-muted-foreground">
                      <div>Created: {new Date(project.created_at).toLocaleDateString()}</div>
                      <div className="flex items-center">
                        View <ArrowRight className="ml-1 h-4 w-4" />
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </>
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-muted-foreground mb-4">No projects found</div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create your first project
              </Button>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}
