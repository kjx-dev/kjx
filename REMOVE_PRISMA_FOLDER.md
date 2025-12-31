# How to Remove the Old Prisma Folder

## Quick Instructions

The old `prisma/` folder is no longer used by your project. All database operations now use the `db/` folder.

### Option 1: Use the Removal Script

1. **Close all database connections:**
   - Stop your development server (`npm run dev` - press Ctrl+C)
   - Close Prisma Studio if it's open
   - Close any other database tools

2. **Run the removal script:**
   ```bash
   scripts\remove-prisma.bat
   ```

   Or use PowerShell:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\cleanup-prisma.ps1
   ```

### Option 2: Manual Removal

1. Close all applications that might use the database
2. Navigate to your project root
3. Delete the `prisma` folder:
   - Windows Explorer: Right-click → Delete
   - Command Prompt: `rmdir /s /q prisma`
   - PowerShell: `Remove-Item -Path prisma -Recurse -Force`

## What's in the Old Prisma Folder?

The old `prisma/` folder contains:
- Old/duplicate database files (`.db` files)
- Old migration files (already copied to `db/migrations/`)
- Old schema file (already copied to `db/schema.prisma`)

**None of these files are used anymore!** All scripts and tools now use files from the `db/` folder.

## Verification

After removal, verify everything still works:

```bash
# Check database status (uses db/ folder)
npm run db:status

# Run migrations (uses db/ folder)
npm run db:migrate

# Seed database (uses db/ folder)
npm run db:seed
```

All commands should work perfectly - they all use the `db/` folder now!

## If the Folder is Locked

If you get a "file is locked" error:
1. Make sure all Node.js processes are stopped
2. Check Task Manager for any `node.exe` processes
3. Close any database browser tools
4. Try again

The folder is safe to delete - it's not used by your application anymore.
