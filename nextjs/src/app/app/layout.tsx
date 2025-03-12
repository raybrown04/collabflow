// src/app/app/layout.tsx
/**
 * Updated: 3/10/2025
 * 
 * Changed to use AppLayoutWithCalendar which includes the calendar sidebar
 * while the main AppLayout no longer includes the right sidebar.
 * Added TaskFiltersProvider for task filtering functionality.
 * Added TaskMultiSelectProvider for multi-select task functionality.
 */
import AppLayoutWithCalendar from '@/components/AppLayoutWithCalendar';
import { GlobalProvider } from '@/lib/context/GlobalContext';
import { TaskFiltersProvider } from '@/lib/context/TaskFiltersContext';
import { TaskMultiSelectProvider } from '@/lib/context/TaskMultiSelectContext';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <GlobalProvider>
            <TaskFiltersProvider>
                <TaskMultiSelectProvider>
                    <AppLayoutWithCalendar>{children}</AppLayoutWithCalendar>
                </TaskMultiSelectProvider>
            </TaskFiltersProvider>
        </GlobalProvider>
    );
}
