/**
 * MonthHeader.tsx
 * Created: 2/27/2025
 * 
 * Simple component to display a month header in the events list.
 * Extracted from VirtualizedEventsList to improve modularity.
 */

import React from "react";

interface MonthHeaderProps {
    month: string;
}

export function MonthHeader({ month }: MonthHeaderProps) {
    return (
        <div className="text-4xl font-bold mb-4 px-2 sticky top-0 bg-background pt-2 pb-2 z-10">
            {month}
        </div>
    );
}
