# Cleanup script to remove old prisma folder
# Run this script if the prisma folder still exists after migration to db/

Write-Host "Cleaning up old prisma folder..." -ForegroundColor Yellow

if (Test-Path "prisma") {
    Write-Host "Found prisma folder. Attempting to remove..." -ForegroundColor Yellow
    
    # Try to remove all files first
    Get-ChildItem -Path "prisma" -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            Remove-Item $_.FullName -Force -ErrorAction Stop
            Write-Host "Removed: $($_.FullName)" -ForegroundColor Green
        } catch {
            Write-Host "Could not remove: $($_.FullName) - File may be locked" -ForegroundColor Red
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Try to remove directories
    Get-ChildItem -Path "prisma" -Recurse -Directory -ErrorAction SilentlyContinue | 
        Sort-Object { $_.FullName.Length } -Descending | ForEach-Object {
        try {
            Remove-Item $_.FullName -Force -Recurse -ErrorAction Stop
            Write-Host "Removed directory: $($_.FullName)" -ForegroundColor Green
        } catch {
            Write-Host "Could not remove directory: $($_.FullName)" -ForegroundColor Yellow
        }
    }
    
    # Try to remove root prisma folder
    if (Test-Path "prisma") {
        try {
            Remove-Item "prisma" -Force -Recurse -ErrorAction Stop
            Write-Host "Successfully removed prisma folder!" -ForegroundColor Green
        } catch {
            Write-Host "Could not remove prisma folder. Database files may be locked." -ForegroundColor Red
            Write-Host "Please close any applications using the database and try again." -ForegroundColor Yellow
            Write-Host "Or manually delete the prisma folder after closing database connections." -ForegroundColor Yellow
        }
    } else {
        Write-Host "prisma folder successfully removed!" -ForegroundColor Green
    }
} else {
    Write-Host "prisma folder does not exist. Already cleaned up!" -ForegroundColor Green
}

Write-Host "`nCleanup complete!" -ForegroundColor Cyan
