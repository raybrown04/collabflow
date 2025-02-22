# Architectural Patterns

## Frontend Structure
- **Next.js App Router**: Utilizing the App Router for route organization and server-side rendering.
- **React Server Components (RSC)**: Leveraging RSC for improved performance and data fetching.
- **Tailwind CSS**: Employing Tailwind CSS for consistent and maintainable styling.
- **shadcn/ui**: Using shadcn/ui components for a consistent and accessible UI.

## Data Flow
- **Supabase ↔ Next.js API routes ↔ Client components**: Data flows from Supabase to Next.js API routes, which then serve data to client components.
- **Supabase Realtime**: Real-time updates are pushed directly from Supabase to client components.

## Security Patterns
- **Row Level Security (RLS)**: Implementing RLS policies in Supabase to control data access at the row level.
- **Authentication**: Using Supabase Auth for user authentication (email/password, OAuth).
- **Middleware**: Utilizing Next.js middleware for authentication checks and session management.

## UI Component Patterns
- **shadcn/ui Components**: The project uses shadcn/ui components for common UI elements such as buttons, cards, and dialogs. These components are located in the `nextjs/src/components/ui/` directory.
- **Radix UI Primitives**: shadcn/ui is built on top of Radix UI primitives, which provide accessible and unstyled components.
- **Tailwind CSS Styling**: Tailwind CSS is used to style the shadcn/ui components.

## CSS Variable Management
- **Tailwind CSS Variables**: The project uses Tailwind CSS variables for theming and styling.
- **Radix UI Colors**: Radix UI colors are used as a base for the Tailwind CSS variables.
- **CSS Variable Overrides**: CSS variables are used to override the default styles of the shadcn/ui components.

## MCP Server Integration
- **supabase-mcp**: Used for database operations, schema management, and data backups.
- **perplexity-mcp**: Used for documentation assistance and code analysis.
- **sequentialthinking**: Used for breaking down complex tasks and problem-solving.
- **firecrawl-mcp**: Used for web scraping and content extraction (if needed).
