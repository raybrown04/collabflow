"use client"

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useGlobal } from "@/lib/context/GlobalContext";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, refreshSession } = useGlobal();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Add a flag to prevent multiple redirects
    let isRedirecting = false;
    
    const checkAuth = async () => {
      // Skip if already redirecting or if we're on the login page
      if (isRedirecting || pathname.startsWith('/auth/')) {
        return;
      }
      
      // If not loading and no user, try to refresh the session
      if (!loading && !user) {
        try {
          isRedirecting = true; // Set flag before attempting refresh
          const success = await refreshSession();
          
          // If still no user after refresh, redirect to login
          if (!success) {
            // Store the current path to redirect back after login
            sessionStorage.setItem("redirectAfterLogin", pathname);
            console.log("Redirecting to login page from:", pathname);
            router.push("/auth/login");
          } else {
            isRedirecting = false; // Reset flag on successful refresh
          }
        } catch (error) {
          console.error("Auth check error:", error);
          isRedirecting = false; // Reset flag on error
        }
      }
    };

    checkAuth();
    
    // Cleanup function to handle component unmount
    return () => {
      isRedirecting = false;
    };
  }, [user, loading, refreshSession, router, pathname]);

  // Show loading indicator while loading
  if (loading || (!user && !loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we have a user, render the children
  return <>{children}</>;
}
