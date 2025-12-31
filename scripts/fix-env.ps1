# Fix DATABASE_URL in .env files

function Fix-EnvFile {
    param($FilePath)
    
    if (Test-Path $FilePath) {
        Write-Host "Fixing $FilePath..." -ForegroundColor Cyan
        $lines = Get-Content $FilePath
        $newLines = @()
        $found = $false
        
        foreach ($line in $lines) {
            if ($line -match '^DATABASE_URL') {
                if (-not $found) {
                    $newLines += 'DATABASE_URL="file:./db/dev.db"'
                    $found = $true
                    Write-Host "  ✓ Replaced DATABASE_URL" -ForegroundColor Green
                }
                # Skip other DATABASE_URL lines
            } else {
                $newLines += $line
            }
        }
        
        if (-not $found) {
            $newLines += 'DATABASE_URL="file:./db/dev.db"'
            Write-Host "  ✓ Added DATABASE_URL" -ForegroundColor Green
        }
        
        $newLines | Set-Content $FilePath
        Write-Host "  ✅ Fixed $FilePath" -ForegroundColor Green
    }
}

Fix-EnvFile ".env"
Fix-EnvFile ".env.local"

Write-Host "`n✅ Environment files fixed!" -ForegroundColor Green
