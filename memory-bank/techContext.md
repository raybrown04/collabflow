# Technical Context

## Technologies Used
- **Frontend**:
    - Next.js (v15+)
    - React (v19+)
    - Tailwind CSS (v3+)
    - shadcn/ui (latest)
        - Style: default
        - RSC: true
        - TSX: true
        - Tailwind:
            - config: tailwind.config.ts
            - css: src/app/globals.css
            - baseColor: neutral
            - cssVariables: true
            - prefix: ""
        - Aliases:
            - components: "@/components"
            - utils: "@/lib/utils"
            - ui: "@/components/ui"
            - lib: "@/lib"
            - hooks: "@/hooks"
        - Icon Library: lucide
    - React Context API or Zustand
- **Backend**:
    - Supabase (PostgreSQL)
    - Supabase Auth
    - Supabase Realtime
- **Other**:
    - Node.js (v18+)
    - npm or yarn

## Development Setup
1. **Install Node.js**: Ensure Node.js v18 or higher is installed.
2. **Install Supabase CLI**: Follow the Supabase CLI installation guide.
3. **Clone the repository**: Clone the project repository to your local machine.
4. **Install dependencies**: Run `npm install` or `yarn install` to install project dependencies.
5. **Configure Supabase**:
    - Initialize Supabase project: `supabase init`
    - Link local project to Supabase project: `supabase link --project-id <your-project-id>`
    - Start Supabase locally (optional): `supabase start`
6. **Set up environment variables**: Create a `.env.local` file with the necessary environment variables (see below).

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for your Supabase project.
- `SUPABASE_SERVICE_ROLE_KEY`: The service role key for your Supabase project (used in server-side code).

## Dependencies
- See `nextjs/package.json` and `supabase/config.toml` for a full list of dependencies.

## Technical Constraints
- **Limited time to deliver MVP**: Focus on essential features first.
- **Simplicity**: Avoid overengineering both code and UI/UX.
- **Supabase limitations**: Be aware of Supabase's limitations and plan accordingly.

## shadcn/ui Integration Notes
- **Potential Conflicts**: Integrating shadcn/ui may introduce conflicts with existing CSS variables, dependency versions, and theming workflows.
- **Mitigation Strategies**:
    - Use `npm install --legacy-peer-deps` or `yarn install` to avoid dependency conflicts.
    - Manage CSS variables carefully to avoid overrides.
    - Follow best practices for integrating shadcn/ui with Tailwind CSS and Radix UI.
