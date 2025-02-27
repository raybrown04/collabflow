import AIQuickSearch from "@/components/AIQuickSearch";
import TaskList from "@/components/TaskList";
import { ToastProvider } from "../../components/ui/use-toast";

export default function Page() {
    return (
        <ToastProvider>
            <div className="flex flex-1 flex-col gap-6 p-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Tasks</h2>
                            <div className="space-y-4">
                                <TaskList filter="today" />
                                <TaskList filter="upcoming" />
                            </div>
                        </div>
                    </div>

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
