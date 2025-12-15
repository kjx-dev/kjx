# Daily Auto Push Script for Windows
# This script automatically commits and pushes changes to the repository

$ErrorActionPreference = "Stop"

# Navigate to the repository directory
$repoPath = "C:\Users\abdullah\Desktop\olx-store"
Set-Location $repoPath

# Check if git is available
try {
    $gitVersion = git --version
    Write-Host "Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not a git repository" -ForegroundColor Red
    exit 1
}

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan

# Check for changes
git add -A
$status = git status --porcelain

if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit" -ForegroundColor Yellow
    exit 0
}

# Create commit with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "chore: daily auto-commit [$timestamp]"

Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to create commit" -ForegroundColor Red
    exit 1
}

# Push changes
Write-Host "Pushing changes to remote..." -ForegroundColor Cyan
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to push changes" -ForegroundColor Red
    Write-Host "You may need to set up remote repository or authentication" -ForegroundColor Yellow
    exit 1
}

Write-Host "Successfully pushed changes!" -ForegroundColor Green


