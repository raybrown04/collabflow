// src/app/app/layout.tsx
/**
 * Updated: 3/4/2025
 * 
 * Changed to use AppLayoutWithCalendar which includes the calendar sidebar
 * while the main AppLayout no longer includes the right sidebar.
 */
import AppLayoutWithCalendar from '@/components/AppLayoutWithCalendar';
import { GlobalProvider } from '@/lib/context/GlobalContext';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <GlobalProvider>
            <AppLayoutWithCalendar>{children}</AppLayoutWithCalendar>
        </GlobalProvider>
    );
}
