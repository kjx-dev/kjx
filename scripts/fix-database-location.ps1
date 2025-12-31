# Fix database location to use only db/dev.db

Write-Host "Fixing database configuration..." -ForegroundColor Cyan

# Fix .env file
if (Test-Path ".env") {
    $content = Get-Content ".env" -Raw
    $content = $content -replace 'DATABASE_URL\s*=\s*"[^"]*"', 'DATABASE_URL="file:./db/dev.db"'
    $content | Set-Content ".env" -NoNewline
    Write-Host "✅ Updated .env" -ForegroundColor Green
}

# Fix .env.local file
if (Test-Path ".env.local") {
    $content = Get-Content ".env.local" -Raw
    $content = $content -replace 'DATABASE_URL\s*=\s*"[^"]*"', 'DATABASE_URL="file:./db/dev.db"'
    $content | Set-Content ".env.local" -NoNewline
    Write-Host "✅ Updated .env.local" -ForegroundColor Green
}

# Remove prisma folder completely
if (Test-Path "prisma") {
    Write-Host "`nRemoving prisma folder..." -ForegroundColor Yellow
    try {
        Remove-Item "prisma" -Recurse -Force -ErrorAction Stop
        Write-Host "✅ Removed prisma folder" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not remove prisma folder: $_" -ForegroundColor Yellow
        Write-Host "   You may need to close any processes using it and delete manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ prisma folder does not exist" -ForegroundColor Green
}

# Verify only one database file exists
Write-Host "`nChecking database files..." -ForegroundColor Cyan
$dbFiles = Get-ChildItem -Path "db" -Filter "*.db" -ErrorAction SilentlyContinue
if ($dbFiles.Count -eq 1) {
    Write-Host "✅ Only one database file found: db/dev.db" -ForegroundColor Green
    Write-Host "   Size: $($dbFiles[0].Length) bytes" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Found $($dbFiles.Count) database files in db folder" -ForegroundColor Yellow
}

Write-Host "`n✅ Configuration complete!" -ForegroundColor Green
Write-Host "   Database location: db/dev.db" -ForegroundColor Gray
Write-Host "   All management in: db/ folder" -ForegroundColor Gray
