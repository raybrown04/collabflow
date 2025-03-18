# CollabFlow Active Context

*Last Updated: March 18, 2025*

## Current Focus

The current development focus is on enhancing the document management functionality with Dropbox integration:

1. **Document Management with Dropbox**
   - Implementing secure OAuth flow with PKCE
   - Building real file operations with Dropbox API
   - Creating folder and file upload functionality
   - ✅ Fixed authentication and token refresh issues
   - ✅ Migrated from deprecated auth-helpers-nextjs to new @supabase/ssr
   - ✅ UI improvements for better usability and alignment with design system

2. **Authentication Improvements**
   - ✅ Enhanced Supabase client for better cookie handling
   - ✅ Implemented session refresh mechanism
   - ✅ Using Supabase client singleton pattern
   - ✅ Fixed cookies API usage for Next.js 15+

## Recent Changes

### Authentication System Enhancements

1. **Supabase SSR Migration**
   - ✅ Migrated from deprecated @supabase/auth-helpers-nextjs to @supabase/ssr
   - ✅ Updated createClientComponentClient to createBrowserClient
   - ✅ Updated createServerComponentClient to createServerClient
   - ✅ Updated createRouteHandlerClient to createServerClient
   - ✅ Fixed cookie handling with proper await/async patterns
   - ✅ Added explicit cookie management functions

2. **AuthGuard Component**
   - Created AuthGuard component to protect routes
   - Implemented redirect to login for unauthenticated users
   - Added loading state for authentication checks

3. **Global Context Updates**
   - Updated GlobalContext to use Supabase client singleton
   - Added refreshSession function for manual session refresh
   - Improved error handling for authentication operations

4. **Supabase Client Singleton**
   - Implemented singleton pattern for Supabase client
   - Centralized client creation in clientSingleton.ts
   - Ensured consistent client usage across the application

### Document Management Integration

1. **Dropbox Authentication**
   - Implemented OAuth flow for Dropbox authentication with PKCE
   - Fixed cookie handling in Supabase client
   - Enhanced token storage and refresh mechanism
   - Created API routes for token exchange and revocation
   - Added robust error handling and state validation

2. **Document UI**
   - Developed DocumentsUi component for browsing documents
   - Added file upload dialog with Dropbox integration
   - Added folder creation functionality
   - Implemented real Dropbox API integration
   - Removed mock implementation for production use
   - ✅ Improved UI layout with centralized search bar
   - ✅ Added three-dot menu for additional actions (Projects filter, Favorites, Refresh, Disconnect)
   - ✅ Cleaned up redundant UI elements for better usability
   - ✅ Aligned "Documents" heading with "Overview" for consistent design
   - ✅ Removed unnecessary descriptive text to optimize space

3. **Database Schema**
   - Created tables for documents, versions, and project associations
   - Implemented RLS policies for security
   - Added functions for document queries

## Active Decisions

### Authentication Strategy

We've decided to use a centralized authentication approach with the following components:

1. **GlobalContext**
   - Manages authentication state
   - Provides user information throughout the application
   - Handles session refresh

2. **AuthGuard**
   - Protects routes from unauthenticated access
   - Redirects to login page when needed
   - Shows loading state during authentication checks

3. **Supabase Client Singleton**
   - Ensures single instance of Supabase client
   - Provides consistent authentication state
   - Simplifies client usage across components
   - Uses new @supabase/ssr package for Next.js 15+ compatibility

### Document Management Approach

For document management, we've chosen the following approach:

1. **Dropbox Integration**
   - Use Dropbox API for document storage
   - Implement OAuth for authentication
   - Store tokens securely in Supabase

2. **Local Metadata**
   - Store document metadata in Supabase
   - Track versions and associations
   - Implement RLS for security

3. **Synchronization Strategy**
   - Two-way sync between local metadata and Dropbox
   - Version tracking for conflict resolution
   - Background sync for seamless experience

4. **User Interface Design**
   - Clean, minimal interface focused on content
   - Consistent alignment with other components
   - Efficient use of space with contextual controls
   - Three-dot menu pattern for secondary actions
   - Search functionality prominently accessible

## Current Challenges

### Authentication Challenges (RESOLVED)

1. **Session Management**
   - ✅ Ensuring consistent session state across components
   - ✅ Handling session expiration gracefully
   - ✅ Refreshing tokens without disrupting user experience

2. **Route Protection**
   - ✅ Protecting nested routes efficiently
   - ✅ Handling redirects after authentication
   - ✅ Preserving state during authentication flow

3. **Cookie API Compatibility**
   - ✅ Updated to use async cookies() API in Next.js 15+
   - ✅ Implemented proper cookie functions for get, set, remove
   - ✅ Fixed cookie handling across server and client components

### Document Management Challenges

1. **OAuth Complexity**
   - ✅ Managing OAuth flow securely
   - ✅ Handling token refresh and revocation
   - Dealing with API rate limits

2. **Synchronization**
   - Resolving conflicts between local and remote changes
   - Handling large file uploads and downloads
   - Maintaining performance during sync operations

3. **UI Consistency**
   - ✅ Ensuring consistent design across various views
   - ✅ Making efficient use of screen space
   - ✅ Providing intuitive access to common actions

## Next Steps

### Short-term Tasks

1. **Authentication**
   - ✅ Migrate from deprecated auth-helpers to @supabase/ssr
   - ✅ Fix cookie handling in Next.js 15+
   - Test AuthGuard with various routes
   - Implement remember me functionality
   - Add session timeout handling

2. **Document Management**
   - ✅ Complete file operations (upload/download)
   - ✅ Implement version history viewer
   - ✅ Add project filtering for documents
   - ✅ Improve UI layout and functionality
   - Add document metadata editing

### Medium-term Tasks

1. **Project Component**
   - Implement project archiving
   - Add advanced filtering options
   - Create project statistics dashboard

2. **Document Management**
   - Develop real-time sync worker
   - Implement permission mapping
   - Add document preview functionality

### Long-term Tasks

1. **Email Integration**
   - Research OAuth for email providers
   - Design unified email interface
   - Implement project-email associations

2. **AI Enhancements**
   - Develop specialized AI assistants
   - Implement document analysis features
   - Create context-aware recommendations

## Implementation Considerations

### Authentication Implementation

The authentication system now uses the following pattern:

```typescript
// GlobalContext.tsx
export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const refreshSession = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        setUser(null);
        return false;
      }
      
      setUser(data.user);
      return true;
    } catch (err) {
      console.error("Error in refreshSession:", err);
      setUser(null);
      return false;
    }
  }, []);
  
  // ... other authentication methods
  
  return (
    <GlobalContext.Provider value={{ user, loading, refreshSession, /* other values */ }}>
      {children}
    </GlobalContext.Provider>
  );
}

// Server components use createServerClient
async function ServerComponent() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
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
  
  // Use supabase client
}

// Client components use getSupabaseClient
function ClientComponent() {
  const supabase = getSupabaseClient();
  
  // Use supabase client
}
```

### Document Management Implementation

The document management system uses the following pattern:

```typescript
// useDropboxAuth.ts
export function useDropboxAuth() {
  const supabase = getSupabaseClient();
  const { user: globalUser } = useGlobal();
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokens, setTokens] = useState<DropboxToken | null>(null);
  
  // Check authentication status
  const checkAuth = useCallback(async () => {
    // Check if user is authenticated with Dropbox
    // ...
  }, [supabase, globalUser]);
  
  // Connect to Dropbox
  const getAuthUrl = useCallback(() => {
    // Generate OAuth URL
    // ...
  }, []);
  
  // Handle OAuth callback
  const handleCallback = useCallback(async (code: string, state: string) => {
    // Exchange code for tokens
    // ...
  }, [supabase, globalUser]);
  
  // List files
  const listFiles = useCallback(async (path: string = "") => {
    // List files from Dropbox
    // ...
  }, [tokens]);
  
  // ... other methods
  
  return {
    isAuthenticated,
    getAuthUrl,
    handleCallback,
    listFiles,
    // ... other values
  };
}

// useDocuments.ts
export function useDocuments({ projectId, searchQuery }: UseDocumentsParams = {}) {
  const supabase = getSupabaseClient();
  const { user, loading: authLoading, refreshSession } = useGlobal();
  
  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    // Fetch documents from Supabase
    // ...
  }, [supabase, projectId, searchQuery, user, refreshSession]);
  
  // Create document
  const createDocument = useCallback(async (document: DocumentInsert, projectIds?: string[]) => {
    // Create document in Supabase
    // ...
  }, [supabase, fetchDocuments]);
  
  // ... other methods
  
  return {
    documents,
    isLoading: query.isLoading || isLoading || authLoading,
    createDocument,
    // ... other values
  };
}
```

### Document UI Improvements

The Document UI component has been improved with the following pattern:

```tsx
// DocumentsUi.tsx
return (
  <div className="space-y-6">
    <div className="flex flex-col space-y-4 mb-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Documents</h2>
        
        {/* Search Bar - centered and resized */}
        <div className="relative w-80 mx-auto">
          <input
            type="text"
            placeholder="Search"
            className="w-full px-4 py-2 border rounded-md"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {/* Search Results Dropdown */}
          {showSearchResults && <SearchResultsList results={searchResults} />}
        </div>
        
        {/* Toolbar buttons */}
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          
          {/* Upload Button */}
          <UploadButton uploadFile={uploadFile} createFolder={createFolder} />
          
          {/* Three-dot Menu */}
          <ThreeDotsMenu 
            activeProjectFilter={activeProjectFilter}
            setActiveProjectFilter={setActiveProjectFilter}
            showFavoritesOnly={showFavoritesOnly}
            setShowFavoritesOnly={setShowFavoritesOnly}
            fetchDropboxFiles={fetchDropboxFiles}
            disconnectDropbox={disconnectDropbox}
          />
        </div>
      </div>
    </div>
    
    {/* Documents Display Section */}
    {viewMode === "grid" ? (
      <GridView documents={documents} />
    ) : (
      <ListView documents={documents} />
    )}
  </div>
);
