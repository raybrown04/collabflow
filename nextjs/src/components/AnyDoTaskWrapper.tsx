"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TaskList } from "./TaskList"
import { Sun, Moon, LayoutGrid, Bell, Hash } from "lucide-react"

export function AnyDoTaskWrapper() {
    const [useDarkTheme, setUseDarkTheme] = useState(true)

    return (
        <div className={`${useDarkTheme ? 'bg-black text-white' : 'bg-white text-black'} min-h-screen p-4 pt-6 pb-20`}>
            {/* Header with title and theme switcher */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">All my tasks</h1>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setUseDarkTheme(!useDarkTheme)}
                >
                    {useDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
            </div>

            {/* Task List Component */}
            <div className={useDarkTheme ? 'anydo-dark' : 'anydo-light'}>
                <TaskList filter="all" isAdmin={true} />
            </div>

            {/* Bottom Navigation Bar (Any.do style) */}
            <div className="fixed bottom-0 left-0 right-0 h-14 border-t flex justify-around items-center px-4 z-20 bg-inherit">
                <Button variant="ghost" size="icon">
                    <LayoutGrid className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                </Button>
                <div className="w-16"></div> {/* Space for centered Add button */}
                <Button variant="ghost" size="icon">
                    <Hash className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                    <Sun className="h-5 w-5" />
                </Button>
            </div>

            {/* Global styles for dark mode */}
            <style jsx global>{`
                .anydo-dark .border {
                    border-color: #333 !important;
                }
                
                .anydo-dark .bg-background {
                    background-color: #111 !important;
                }
                
                .anydo-dark .border-gray-100 {
                    border-color: #333 !important;
                }
                
                .anydo-dark .text-gray-500 {
                    color: #999 !important;
                }
                
                .anydo-dark .text-muted-foreground {
                    color: #999 !important;
                }
            `}</style>
        </div>
    )
}

export default AnyDoTaskWrapper
