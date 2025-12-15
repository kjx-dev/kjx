@echo off
REM Daily Auto Push Script for Windows (Batch version)
REM This script automatically commits and pushes changes to the repository

cd /d "C:\Users\abdullah\Desktop\olx-store"

REM Check if git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo Error: Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/download/win
    exit /b 1
)

REM Check if we're in a git repository
if not exist ".git" (
    echo Error: Not a git repository
    exit /b 1
)

REM Stage all changes
git add -A

REM Check for changes
git diff --staged --quiet
if errorlevel 1 (
    REM Create commit with timestamp
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
    set timestamp=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%:%datetime:~12,2%
    
    echo Committing changes...
    git commit -m "chore: daily auto-commit [%timestamp%]"
    
    if errorlevel 1 (
        echo Error: Failed to create commit
        exit /b 1
    )
    
    REM Push changes
    echo Pushing changes to remote...
    git push
    
    if errorlevel 1 (
        echo Error: Failed to push changes
        echo You may need to set up remote repository or authentication
        exit /b 1
    )
    
    echo Successfully pushed changes!
) else (
    echo No changes to commit
)


