# Active Context

## Current Focus
- Implementing user authentication using Supabase Auth.
- Setting up the basic database schema in Supabase.
- Scaffolding the Next.js frontend structure with basic routing.

## Recent Changes
- Created the initial project brief (`projectbrief.md`).
- Defined the product context, system patterns, and technical context in their respective files.
- Updated `techContext.md` and `systemPatterns.md` to reflect the existing `shadcn/ui` integration.

## Active Decisions
- **State Management**: Deciding between React Context API and Zustand for state management. Leaning towards Zustand for simplicity.
- **UI Library**: Evaluating additional UI libraries beyond Tailwind CSS for specific components. `shadcn/ui` is already integrated for common UI elements.

## Next Steps
1. **Implement Supabase Auth**:
    - Set up email/password authentication.
    - Implement OAuth (Google, GitHub).
    - Configure Row Level Security (RLS) policies.
2. **Define Database Schema**:
    - Create tables for tasks, projects, users, and comments.
    - Define relationships between tables.
3. **Scaffold Next.js Frontend**:
    - Set up basic routing structure.
    - Create layout components.
    - Implement basic UI elements.

## Notes
- The project already includes `shadcn/ui` components, located in the `nextjs/src/components/ui/` directory.
