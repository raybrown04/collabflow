import AIQuickSearch from "@/components/AIQuickSearch";
import TaskList from "@/components/TaskList";
import { ToastProvider } from "../../components/ui/use-toast";

export default function Page() {
    return (
        <ToastProvider>
            <div className="flex flex-1 h-full">
                {/* Left side - Tasks component taking full height */}
                <div className="w-full md:w-1/2 border-r flex flex-col h-full">
                    <TaskList filter="all" maxItems={40} />
                </div>

                {/* Right side - Other widgets */}
                <div className="hidden md:block w-1/2 p-6 space-y-6 overflow-y-auto">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">AI Quick Search</h2>
                            <AIQuickSearch />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
                            <div className="rounded-lg border p-4 min-h-[200px]">
                                <div className="text-sm text-muted-foreground text-center py-8">
                                    No recent projects.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ToastProvider>
    );
}
