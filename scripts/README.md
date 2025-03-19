# Supabase Sync Scripts

This directory contains scripts to help sync your local Supabase instance with the remote project.

## Prerequisites

- Supabase CLI installed
- Access to the Supabase project

## Scripts

### supabase-sync.ps1 (Windows)

PowerShell script for Windows users to sync the local Supabase instance with the remote project.

#### Usage

```powershell
# Run from the project root
.\scripts\supabase-sync.ps1
```

### supabase-sync.sh (Unix/Linux/macOS)

Bash script for Unix/Linux/macOS users to sync the local Supabase instance with the remote project.

#### Usage

```bash
# Make the script executable (first time only)
chmod +x scripts/supabase-sync.sh

# Run from the project root
./scripts/supabase-sync.sh
```

## Configuration

Before using these scripts, you need to update the `PROJECT_REF` variable in the script with your actual Supabase project reference.

## What the Scripts Do

1. Check if Supabase CLI is installed
2. Check if the project is linked to the remote Supabase project
3. Pull the latest schema from the remote project
4. Restart the local Supabase instance to apply changes

## Scheduling Regular Syncs

### Windows

You can use Task Scheduler to run the PowerShell script at regular intervals:

1. Open Task Scheduler
2. Create a new task
3. Set the trigger to run at your desired schedule
4. Set the action to run PowerShell with the script path as an argument

### Unix/Linux/macOS

You can use cron to run the bash script at regular intervals:

1. Open your crontab: `crontab -e`
2. Add a line like: `0 9 * * * /path/to/your/project/scripts/supabase-sync.sh`
   (This will run the script every day at 9 AM)
