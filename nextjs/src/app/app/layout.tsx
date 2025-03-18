// src/app/app/layout.tsx
/**
 * Updated: 3/17/2025
 * 
 * Changed to use AppLayoutWithCalendar which includes the calendar sidebar
 * while the main AppLayout no longer includes the right sidebar.
 * Added TaskFiltersProvider for task filtering functionality.
 * Added TaskMultiSelectProvider for multi-select task functionality.
 * Added ProjectTagProvider for project tagging functionality.
 * Added AuthGuard to protect all routes under /app/.
 * Added devUtils for development mode utilities.
 * Added DevModeIndicator to show when running in development mode with mock auth.
 */
import AppLayoutWithCalendar from '@/components/AppLayoutWithCalendar';
import { GlobalProvider } from '@/lib/context/GlobalContext';
import { TaskFiltersProvider } from '@/lib/context/TaskFiltersContext';
import { TaskMultiSelectProvider } from '@/lib/context/TaskMultiSelectContext';
import { ProjectTagProvider } from '@/lib/context/ProjectTagContext';
import { AuthGuard } from '@/components/AuthGuard';
import { DevModeIndicator } from '@/components/DevModeIndicator';

// Import devUtils to make development utilities available
// This is a no-op import that sets up the window.devUtils object
import '@/lib/devUtils';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <GlobalProvider>
            <AuthGuard>
                <TaskFiltersProvider>
                    <TaskMultiSelectProvider>
                        <ProjectTagProvider>
                            <AppLayoutWithCalendar>{children}</AppLayoutWithCalendar>
                            {/* Development mode indicator */}
                            <DevModeIndicator />
                        </ProjectTagProvider>
                    </TaskMultiSelectProvider>
                </TaskFiltersProvider>
            </AuthGuard>
        </GlobalProvider>
    );
}
