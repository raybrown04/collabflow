# CollabFlow Technical Context

*Last Updated: March 17, 2025*

## Technology Stack

### Frontend

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.2+
- **UI Library**: React 18
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context, React Query
- **Form Handling**: React Hook Form
- **Data Fetching**: React Query, Supabase Client
- **Component Library**: Custom components based on Radix UI primitives

### Backend

- **Platform**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime
- **Functions**: Supabase Edge Functions (for serverless functions)

### External Integrations

- **Document Storage**: Dropbox API with OAuth 2.0 and PKCE
- **Email Integration**: Planned (Outlook, Gmail, Apple Mail)
- **AI Services**: Perplexity API

### Development Tools

- **Package Manager**: npm
- **Build Tool**: Next.js built-in
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Jest, React Testing Library
- **Version Control**: Git
- **CI/CD**: GitHub Actions

### MCP Servers (Development Tools)

- **memory**: Persistent knowledge storage
- **perplexity-mcp**: AI-powered search and documentation
- **firecrawl-mcp-server**: Web scraping and content extraction
- **browser-tools**: Browser debugging and testing
- **21st-dev-magic-mcp**: UI component generation

## Development Environment

### Local Setup

1. **Node.js**: v18.17.0 or later
2. **npm**: v9.6.7 or later
3. **Supabase CLI**: For local development and migrations
4. **Environment Variables**: Configured in `.env.local`

### Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Dropbox
NEXT_PUBLIC_DROPBOX_APP_KEY=your-dropbox-app-key
DROPBOX_APP_SECRET=your-dropbox-app-secret

# Perplexity
PERPLEXITY_API_KEY=your-perplexity-api-key

# Other
NEXT_PUBLIC_URL=http://localhost:3000
```

### Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Database Schema

### Core Tables

1. **auth.users**: User accounts (managed by Supabase Auth)
2. **calendar_events**: Calendar events with title, description, date, type
3. **tasks**: Tasks with title, description, status, priority, due date
4. **task_lists**: Lists for organizing tasks
5. **projects**: Projects with name, description, color
6. **documents**: Document metadata with links to storage
7. **document_versions**: Version history for documents
8. **document_projects**: Many-to-many relationship between documents and projects
9. **dropbox_auth**: Dropbox authentication tokens
10. **user_settings**: User preferences and settings
11. **ai_messages**: AI assistant conversation history

### Row-Level Security (RLS)

All tables have RLS policies to ensure users can only access their own data:

```sql
-- Example RLS policy for tasks
create policy "Users can view their own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);
```

## Authentication System

### Authentication Flow

1. User signs up or logs in through Supabase Auth
2. Session is stored in cookies and local storage
3. `GlobalContext` manages authentication state
4. `AuthGuard` component protects routes
5. Session refresh is handled automatically

### Session Management

- Sessions are refreshed automatically by Supabase
- `refreshSession` function in `GlobalContext` handles manual refresh
- Session state is stored in React Context

## API Structure

### Supabase Client

- Singleton pattern for Supabase client
- Centralized in `clientSingleton.ts`
- Used throughout the application for data access

### Custom Hooks

- Encapsulate data fetching and state management
- Use React Query for caching and background updates
- Handle loading, error, and success states

### API Routes

- Next.js API routes for server-side operations
- Used for OAuth flows and complex operations
- Located in `app/api/` directory

### Dropbox Integration

- **OAuth 2.0 with PKCE**
  - Secure authorization code flow with PKCE challenge
  - Token storage in Supabase database
  - Automatic token refresh mechanism
  - Revocation endpoint for disconnecting

- **File Operations**
  - File listing with pagination
  - File upload with progress tracking
  - Folder creation and management
  - File download and sharing

- **Synchronization**
  - Two-way sync between local metadata and Dropbox
  - Version tracking for conflict resolution
  - Background sync for seamless experience

## Component Architecture

### UI Components

- Based on Radix UI primitives
- Styled with Tailwind CSS
- Accessible and responsive
- Located in `components/ui/` directory

### Feature Components

- Implement specific features
- Composed of UI components
- Located in `components/` directory

### Page Components

- Represent routes in the application
- Composed of feature components
- Located in `app/` directory

## State Management

### Global State

- Authentication state in `GlobalContext`
- Theme state in `GlobalContext`
- Task filters in `TaskFiltersContext`
- Project tags in `ProjectTagContext`

### Server State

- Managed with React Query
- Cached and synchronized with server
- Optimistic updates for better UX

### Local State

- Component-specific state with `useState`
- Form state with React Hook Form
- Memoized values with `useMemo` and `useCallback`

## Performance Considerations

### Code Splitting

- Route-based code splitting with Next.js
- Dynamic imports for large components
- Lazy loading for below-the-fold content

### Memoization

- `useMemo` for expensive computations
- `useCallback` for event handlers
- `React.memo` for pure components

### Image Optimization

- Next.js Image component for optimized images
- Proper sizing and formats
- Lazy loading for images

### Virtualization

- Virtual lists for long content
- Pagination for large datasets
- Infinite scrolling for continuous loading

## Deployment Strategy

### Production Environment

- Vercel for hosting
- Supabase for backend services
- CI/CD with GitHub Actions

### Preview Environments

- Vercel preview deployments for pull requests
- Supabase preview environments for database changes

### Monitoring

- Vercel Analytics for frontend monitoring
- Supabase monitoring for backend services
- Error tracking with Sentry

## Testing Strategy

### Unit Testing

- Jest for test runner
- React Testing Library for component testing
- Mock Service Worker for API mocking

### Integration Testing

- Testing component interactions
- Testing data flow
- Testing authentication flows

### End-to-End Testing

- Cypress for end-to-end testing
- Testing user flows
- Testing authentication and authorization
