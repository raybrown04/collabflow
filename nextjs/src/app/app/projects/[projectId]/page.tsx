import { notFound } from "next/navigation";
import AIQuickSearch from "@/components/AIQuickSearch";
import TaskList from "@/components/TaskList";
import { ToastProvider } from "@/components/ui/use-toast";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";
import ProjectHeader from "@/components/ProjectHeader";
import { Project } from "@/hooks/useProjects"; // Import the Project type

export const dynamic = "force-dynamic";

// Define the page props to receive the projectId from the URL
interface PageProps {
  params: {
    projectId: string;
  };
}

// Mock project data for development mode
const mockProjects = {
  'proj-1': { 
    id: 'proj-1', 
    name: 'Marketing Campaign', 
    color: '#3B82F6', 
    description: 'Q2 Product Launch',
    user_id: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  'proj-2': { 
    id: 'proj-2', 
    name: 'Website Redesign', 
    color: '#10B981', 
    description: 'UX Improvements',
    user_id: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  'proj-3': { 
    id: 'proj-3', 
    name: 'Mobile App', 
    color: '#F59E0B', 
    description: 'iOS and Android',
    user_id: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  'proj-4': { 
    id: 'proj-4', 
    name: 'Annual Report', 
    color: '#EF4444', 
    description: 'Financial documents',
    user_id: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
};

export default async function ProjectPage({ params }: PageProps) {
  const { projectId } = params;
  
  // Use mock data in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('Using mock project data for:', projectId);
    
    const mockProject = mockProjects[projectId as keyof typeof mockProjects];
    
    if (!mockProject) {
      console.error('Mock project not found:', projectId);
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p>The requested project does not exist in development mode.</p>
          <p>Available project IDs: {Object.keys(mockProjects).join(', ')}</p>
        </div>
      );
    }
    
    return (
      <ToastProvider>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Project Header Component */}
          <ProjectHeader project={mockProject as Project} />
          
          <div className="flex flex-1 h-full overflow-hidden">
            {/* Left side - Tasks component taking full height filtered by project */}
            <div className="w-full md:w-1/2 flex flex-col h-full">
              <TaskList filter="all" maxItems={40} projectId={projectId} />
            </div>

            {/* Right side - Other widgets */}
            <div className="hidden md:block w-1/2 p-0 pl-8 space-y-6 overflow-hidden">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">AI Quick Search</h2>
                  <AIQuickSearch projectContext={mockProject.name} />
                </div>

                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-2">Project Details</h2>
                  <div className="rounded-lg border p-4">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Description:</span> {mockProject.description || "No description provided."}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">Color:</span>
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: mockProject.color }}
                        />
                        <span className="text-sm">{mockProject.color}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ToastProvider>
    );
  }
  
  // Production mode - create Supabase client for server components
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
  
  try {
    // Fetch the project details
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    
    // If the project doesn't exist or there's an error, show 404
    if (error || !project) {
      console.error('Project not found or error:', error);
      notFound();
    }
  
    return (
      <ToastProvider>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Project Header Component */}
          <ProjectHeader project={project} />
          
          <div className="flex flex-1 h-full overflow-hidden">
            {/* Left side - Tasks component taking full height filtered by project */}
            <div className="w-full md:w-1/2 flex flex-col h-full">
              <TaskList filter="all" maxItems={40} projectId={projectId} />
            </div>

            {/* Right side - Other widgets */}
            <div className="hidden md:block w-1/2 p-0 pl-8 space-y-6 overflow-hidden">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">AI Quick Search</h2>
                  <AIQuickSearch projectContext={project.name} />
                </div>

                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-2">Project Details</h2>
                  <div className="rounded-lg border p-4">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Description:</span> {project.description || "No description provided."}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">Color:</span>
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="text-sm">{project.color}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ToastProvider>
    );
  } catch (error) {
    console.error('Error fetching project details:', error);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>An error occurred while fetching project details.</p>
      </div>
    );
  }
}
