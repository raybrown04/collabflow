import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Sidebar } from "@/components/ui/sidebar";

export function SidebarLeft() {
    return (
        <Sidebar>
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">Dashboard</span>
                </div>
                <nav className="grid gap-1">
                    <Link
                        href="#"
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "justify-start"
                        )}
                    >
                        Overview
                    </Link>
                    <Link
                        href="#"
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "justify-start"
                        )}
                    >
                        Projects
                    </Link>
                    <Link
                        href="#"
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "justify-start"
                        )}
                    >
                        Tasks
                    </Link>
                    <Link
                        href="#"
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "justify-start"
                        )}
                    >
                        Reports
                    </Link>
                </nav>
            </div>
        </Sidebar>
    );
}
