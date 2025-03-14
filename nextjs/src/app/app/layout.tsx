// src/app/app/layout.tsx
/**
 * Updated: 3/13/2025
 * 
 * Changed to use AppLayoutWithCalendar which includes the calendar sidebar
 * while the main AppLayout no longer includes the right sidebar.
 * Added TaskFiltersProvider for task filtering functionality.
 * Added TaskMultiSelectProvider for multi-select task functionality.
 * Added ProjectTagProvider for project tagging functionality.
 */
import AppLayoutWithCalendar from '@/components/AppLayoutWithCalendar';
import { GlobalProvider } from '@/lib/context/GlobalContext';
import { TaskFiltersProvider } from '@/lib/context/TaskFiltersContext';
import { TaskMultiSelectProvider } from '@/lib/context/TaskMultiSelectContext';
import { ProjectTagProvider } from '@/lib/context/ProjectTagContext';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <GlobalProvider>
            <TaskFiltersProvider>
                <TaskMultiSelectProvider>
                    <ProjectTagProvider>
                        <AppLayoutWithCalendar>{children}</AppLayoutWithCalendar>
                    </ProjectTagProvider>
                </TaskMultiSelectProvider>
            </TaskFiltersProvider>
        </GlobalProvider>
    );
}
