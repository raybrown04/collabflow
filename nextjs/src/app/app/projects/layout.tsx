import { ReactNode } from "react";

interface ProjectsLayoutProps {
  children: ReactNode;
}

export default function ProjectsLayout({ children }: ProjectsLayoutProps) {
  // This layout inherits from the app layout (app/app/layout.tsx)
  // and provides a consistent structure for all project pages
  
  return (
    // The main content area
    <main className="flex-1 overflow-auto">
      {children}
    </main>
  );
}
