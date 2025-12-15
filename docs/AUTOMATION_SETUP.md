# Daily Auto Push Setup Guide

This guide explains how to set up automatic daily code pushes for your repository.

## Option 1: GitHub Actions (Recommended - Cloud-based)

This option uses GitHub Actions to automatically commit and push changes daily. It runs in the cloud, so your computer doesn't need to be on.

### Setup Steps:

1. **Push your repository to GitHub** (if not already done):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **The workflow is already created** at `.github/workflows/daily-push.yml`

3. **Enable GitHub Actions**:
   - Go to your repository on GitHub
   - Click on "Actions" tab
   - The workflow will automatically run daily at 00:00 UTC

4. **Customize the schedule** (optional):
   - Edit `.github/workflows/daily-push.yml`
   - Change the cron schedule: `'0 0 * * *'` (format: minute hour day month weekday)
   - Examples:
     - `'0 9 * * *'` - Every day at 9:00 AM UTC
     - `'0 0 * * 1'` - Every Monday at midnight
     - `'0 */6 * * *'` - Every 6 hours

5. **Manual trigger**:
   - Go to Actions tab → "Daily Auto Push" → "Run workflow"

### How it works:
- Runs daily at the scheduled time
- Checks for uncommitted changes
- Creates a commit with timestamp if changes exist
- Pushes to the repository

---

## Option 2: Windows Task Scheduler (Local)

This option runs on your local Windows machine using Task Scheduler.

### Setup Steps:

1. **Open Task Scheduler**:
   - Press `Win + R`, type `taskschd.msc`, press Enter

2. **Create Basic Task**:
   - Click "Create Basic Task" in the right panel
   - Name: "Daily Git Push"
   - Description: "Automatically push code changes daily"

3. **Set Trigger**:
   - Choose "Daily"
   - Set the time (e.g., 9:00 AM)
   - Choose recurrence (daily)

4. **Set Action**:
   - Choose "Start a program"
   - Program/script: `powershell.exe`
   - Add arguments: `-ExecutionPolicy Bypass -File "C:\Users\abdullah\Desktop\olx-store\scripts\daily-push.ps1"`
   - Start in: `C:\Users\abdullah\Desktop\olx-store`

5. **Configure Settings**:
   - Check "Run whether user is logged on or not" (optional)
   - Check "Run with highest privileges" (if needed)
   - Check "Configure for: Windows 10" (or your Windows version)

6. **Test the script manually first**:
   ```powershell
   cd C:\Users\abdullah\Desktop\olx-store
   .\scripts\daily-push.ps1
   ```

### Alternative: Using Batch Script

If PowerShell has execution policy restrictions, you can use the batch script instead:

- Program/script: `C:\Users\abdullah\Desktop\olx-store\scripts\daily-push.bat`
- Add arguments: (leave empty)
- Start in: `C:\Users\abdullah\Desktop\olx-store`

---

## Prerequisites

### For GitHub Actions:
- Repository must be on GitHub
- GitHub Actions must be enabled (enabled by default)

### For Windows Task Scheduler:
- Git must be installed and in PATH
- Repository must have a remote configured
- Git credentials must be set up (SSH key or credential manager)

### Setting up Git Credentials:

**Option A: Using Credential Manager (Recommended for HTTPS)**
```bash
git config --global credential.helper wincred
# On first push, Windows will prompt for credentials and save them
```

**Option B: Using SSH Key**
1. Generate SSH key: `ssh-keygen -t ed25519 -C "your_email@example.com"`
2. Add public key to GitHub: Settings → SSH and GPG keys → New SSH key
3. Change remote to SSH: `git remote set-url origin git@github.com:USERNAME/REPO.git`

---

## Troubleshooting

### GitHub Actions:
- Check Actions tab for error logs
- Ensure repository has write permissions
- Verify the workflow file syntax is correct

### Windows Task Scheduler:
- Check Task Scheduler history for errors
- Run the script manually to test
- Ensure Git is in system PATH
- Check if remote repository is configured: `git remote -v`
- Verify Git credentials are saved

### Common Issues:

1. **"Git is not recognized"**:
   - Install Git from https://git-scm.com/download/win
   - Add Git to system PATH during installation

2. **"Authentication failed"**:
   - Set up Git credentials (see Prerequisites section)
   - For HTTPS: Use credential manager
   - For SSH: Set up SSH keys

3. **"No changes to commit"**:
   - This is normal if there are no changes
   - The script will exit successfully

---

## Notes

- The scripts only commit and push if there are actual changes
- Commit messages include timestamps for tracking
- Both scripts are safe to run multiple times
- GitHub Actions runs in UTC timezone
- Windows Task Scheduler runs in your local timezone


