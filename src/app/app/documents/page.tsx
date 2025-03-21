import { Metadata } from "next";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DocumentsUi } from "@/components/DocumentsUi";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Documents | CollabFlow",
  description: "Manage and organize your documents with Dropbox integration",
};

// Loading component for Suspense fallback
function DocumentsLoading() {
  return (
    <div className="flex flex-col flex-1 w-full">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-40"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {}, // Server components can't set cookies
          remove: () => {} // Server components can't remove cookies
        }
      }
    );
    return (
      <div className="flex flex-col flex-1 w-full">
        <div className="p-2 pt-3">
          <Suspense fallback={<DocumentsLoading />}>
            <DocumentsUi />
          </Suspense>
        </div>
      </div>
    );
  } catch (err) {
    console.error("Unexpected error in DocumentsPage:", err);
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <h2 className="text-xl font-semibold mb-4">Something Went Wrong</h2>
        <p className="text-muted-foreground">
          An unexpected error occurred while loading your documents.
        </p>
      </div>
    );
  }
}
