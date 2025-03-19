# Supabase Sync Script for Windows
# This script syncs the local Supabase instance with the remote project

# Configuration
$PROJECT_ID = "sasstemplate"
$PROJECT_REF = "ttbdbkhvgistwrhculrf"  # Project reference from NEXT_PUBLIC_SUPABASE_URL

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
}
catch {
    Write-Error "Supabase CLI is not installed. Please install it first."
    exit 1
}

# Check if project is linked
$status = supabase status
if ($status -notmatch "Project linked") {
    Write-Host "Project is not linked. Linking now..."
    supabase link --project-ref $PROJECT_REF
}

# Pull the latest schema from remote
Write-Host "Pulling latest schema from remote..."
supabase db pull

# Restart local Supabase to apply changes
Write-Host "Restarting local Supabase..."
supabase stop
supabase start

Write-Host "Sync completed successfully!"
