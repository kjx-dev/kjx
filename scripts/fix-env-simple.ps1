# Simple script to fix DATABASE_URL

$envFiles = @('.env', '.env.local')

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Write-Host "Processing $file..."
        $lines = Get-Content $file
        $output = @()
        $databaseUrlSet = $false
        
        foreach ($line in $lines) {
            if ($line -like 'DATABASE_URL*') {
                if (-not $databaseUrlSet) {
                    $output += 'DATABASE_URL="file:./db/dev.db"'
                    $databaseUrlSet = $true
                }
            } else {
                $output += $line
            }
        }
        
        if (-not $databaseUrlSet) {
            $output += 'DATABASE_URL="file:./db/dev.db"'
        }
        
        $output | Set-Content $file
        Write-Host "  Fixed $file" -ForegroundColor Green
    }
}

Write-Host "Done!" -ForegroundColor Green
