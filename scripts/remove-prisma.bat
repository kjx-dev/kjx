@echo off
echo Attempting to remove prisma folder...
if exist prisma (
    rmdir /s /q prisma 2>nul
    if exist prisma (
        echo.
        echo ERROR: Could not remove prisma folder completely.
        echo The database file may be locked by a running process.
        echo.
        echo Please close any applications using the database:
        echo   - Stop development server (Ctrl+C if running)
        echo   - Close Prisma Studio if open
        echo   - Close any database tools
        echo.
        echo Then run this script again or manually delete the prisma folder.
    ) else (
        echo Successfully removed prisma folder!
    )
) else (
    echo prisma folder does not exist - already removed!
)
pause
