# CollabFlow System Patterns

*Last Updated: March 17, 2025*

## Architecture Overview

CollabFlow follows a modern web application architecture with clear separation of concerns:

```mermaid
graph TD
    A[Client] --> B[Next.js App Router]
    B --> C[Server Components]
    B --> D[Client Components]
    C --> E[Supabase Client]
    D --> E
    E --> F[Supabase Backend]
    F --> G[PostgreSQL Database]
    F --> H[Authentication]
    F --> I[Storage]
    F --> J[Realtime]
```

## Core Design Patterns

### Component Architecture

CollabFlow uses a component-based architecture with the following patterns:

1. **Container/Presentation Pattern**
   - Container components handle data fetching and state management
   - Presentation components focus on rendering UI
   - Example: `TaskList` (container) and `TaskItem` (presentation)

2. **Context Providers**
   - Global state managed through React Context
   - Providers wrap the application at appropriate levels
   - Example: `GlobalProvider`, `TaskFiltersProvider`, `ProjectTagProvider`

3. **Custom Hooks**
   - Reusable logic extracted into custom hooks
   - Hooks encapsulate data fetching, state management, and side effects
   - Example: `useDocuments`, `useDropboxAuth`, `useProjects`

4. **Server Components**
   - Used for data fetching and initial rendering
   - Reduce client-side JavaScript
   - Example: Layout components, page components

5. **Client Components**
   - Used for interactive elements
   - Marked with "use client" directive
   - Example: Form components, interactive widgets

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant AuthGuard
    participant GlobalContext
    participant Supabase

    User->>Client: Access protected route
    Client->>AuthGuard: Render protected content
    AuthGuard->>GlobalContext: Check authentication
    GlobalContext->>Supabase: Get session
    
    alt No session
        Supabase-->>GlobalContext: No session
        GlobalContext->>AuthGuard: Not authenticated
        AuthGuard->>Client: Redirect to login
        Client->>User: Show login page
    else Session exists
        Supabase-->>GlobalContext: Session data
        GlobalContext->>AuthGuard: Authenticated
        AuthGuard->>Client: Render protected content
        Client->>User: Show protected content
    end
```

### Data Flow

```mermaid
graph TD
    A[User Action] --> B[React Component]
    B --> C[Custom Hook]
    C --> D[React Query]
    D --> E[Supabase Client]
    E --> F[Supabase API]
    F --> G[Database]
    
    G --> F
    F --> E
    E --> D
    D --> C
    C --> B
    B --> H[UI Update]
```

## Key Technical Decisions

### 1. Next.js App Router

- **Decision**: Use Next.js App Router instead of Pages Router
- **Rationale**: Better support for server components, improved routing, and layout nesting
- **Implementation**: All routes defined in `app/` directory with nested layouts

### 2. Supabase for Backend

- **Decision**: Use Supabase instead of custom backend
- **Rationale**: Provides authentication, database, storage, and realtime features in one platform
- **Implementation**: Supabase client for data access, RLS policies for security

### 3. React Query for Server State

- **Decision**: Use React Query for server state management
- **Rationale**: Provides caching, background updates, and optimistic updates
- **Implementation**: Custom hooks wrap React Query functionality

### 4. Global Context for Authentication

- **Decision**: Use React Context for global authentication state
- **Rationale**: Provides access to user state throughout the application
- **Implementation**: `GlobalContext` with user state and authentication methods

### 5. Singleton Pattern for Supabase Client

- **Decision**: Use singleton pattern for Supabase client
- **Rationale**: Ensures single instance of Supabase client across the application
- **Implementation**: `clientSingleton.ts` exports a function to get the Supabase client

## Component Relationships

### Layout Structure

```mermaid
graph TD
    A[RootLayout] --> B[AuthLayout]
    A --> C[AppLayout]
    C --> D[AppLayoutWithCalendar]
    D --> E[ProjectLayout]
    
    B --> B1[LoginPage]
    B --> B2[RegisterPage]
    
    C --> C1[DashboardPage]
    C --> C2[UserSettingsPage]
    
    D --> D1[TasksPage]
    D --> D2[DocumentsPage]
    
    E --> E1[ProjectDashboardPage]
```

### Context Providers Hierarchy

```mermaid
graph TD
    A[GlobalProvider] --> B[TaskFiltersProvider]
    B --> C[TaskMultiSelectProvider]
    C --> D[ProjectTagProvider]
    D --> E[Component Tree]
```

## Database Schema Relationships

```mermaid
erDiagram
    USERS ||--o{ CALENDAR_EVENTS : creates
    USERS ||--o{ TASKS : creates
    USERS ||--o{ PROJECTS : creates
    USERS ||--o{ DOCUMENTS : uploads
    USERS ||--o{ USER_SETTINGS : has
    USERS ||--o{ DROPBOX_AUTH : connects
    
    PROJECTS ||--o{ TASKS : contains
    PROJECTS ||--o{ CALENDAR_EVENTS : contains
    PROJECTS ||--o{ DOCUMENTS : contains
    
    TASKS }o--o{ TASK_LISTS : belongs_to
    
    DOCUMENTS ||--o{ DOCUMENT_VERSIONS : has
```

## Authentication and Authorization

### Authentication Methods

- Email/password authentication
- Social login (planned)
- Multi-factor authentication (planned)

### Authorization Model

- Row-level security (RLS) policies in Supabase
- User-based ownership of data
- Role-based access control (admin vs. user)

## Error Handling Strategy

1. **Client-Side Validation**
   - Form validation using controlled components
   - Input constraints and feedback

2. **API Error Handling**
   - Try/catch blocks for async operations
   - Error state in custom hooks
   - User-friendly error messages

3. **Global Error Boundary**
   - Catch unhandled errors
   - Fallback UI for error states

## Performance Optimization Techniques

1. **Code Splitting**
   - Dynamic imports for route-based code splitting
   - Lazy loading of components

2. **Memoization**
   - React.memo for expensive components
   - useMemo and useCallback for computed values and functions

3. **Image Optimization**
   - Next.js Image component for optimized images
   - Proper sizing and formats

4. **Virtualization**
   - Virtual lists for long content (events, tasks)
   - Pagination for large datasets

## Testing Strategy

1. **Unit Testing**
   - Component testing with React Testing Library
   - Hook testing with custom test utilities

2. **Integration Testing**
   - API integration tests
   - Component interaction tests

3. **End-to-End Testing**
   - User flow testing with Cypress
   - Authentication and authorization testing
