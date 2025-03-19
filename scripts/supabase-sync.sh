#!/bin/bash

# Supabase Sync Script
# This script syncs the local Supabase instance with the remote project

# Configuration
PROJECT_ID="sasstemplate"
PROJECT_REF="your-project-ref"  # Replace with your actual project reference

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Please install it first."
    exit 1
fi

# Check if project is linked
if ! supabase status | grep -q "Project linked"; then
    echo "Project is not linked. Linking now..."
    supabase link --project-ref $PROJECT_REF
fi

# Pull the latest schema from remote
echo "Pulling latest schema from remote..."
supabase db pull

# Restart local Supabase to apply changes
echo "Restarting local Supabase..."
supabase stop
supabase start

echo "Sync completed successfully!"
