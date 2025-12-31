# Project Restructuring - File and Folder Renames

This document summarizes all file and folder renames performed to improve code readability and organization.

## Files Renamed

### Pages
- `pages/posting-ads.js` → `pages/posting-guide.js`
  - More descriptive name for the posting guidelines page
  - Updated reference in `pages/tips.js`

- `pages/manage.js` → `pages/my-ads.js`
  - Clearer name indicating user's ad management page
  - Updated all route references from `/manage` to `/my-ads` in:
    - `pages/sell.js`
    - `pages/productDetails.js`
    - `pages/index.js`
    - `pages/favorites.js`
    - `pages/category/[slug].js`
    - `components/Header.js`
    - `pages/sitemap.xml.js`

### Server Files
- `server/ws-server.js` → `server/websocket-server.js`
  - More descriptive name for WebSocket server
  - Updated reference in `docs/DEPLOYMENT.md`

### Scripts
- `scripts/db-manage.js` → `scripts/database-manager.js`
  - More descriptive name for database management script
  - Updated all npm scripts in `package.json`
  - Updated comments and usage examples in the script itself

- `scripts/verify_prisma.js` → `scripts/verify-database.js`
  - Consistent naming convention (kebab-case)
  - More descriptive name

### Library Files
- `lib/headerAuth.js` → `lib/auth-helpers.js`
  - More descriptive name indicating authentication helper functions

- `lib/prisma.js` → `lib/database-helpers.js`
  - More descriptive name for database helper utilities

### Styles
- `assets/css/` → `styles/`
  - Simplified folder structure
  - Updated imports in `pages/_app.js`:
    - `assets/css/style.css` → `styles/style.css`
    - `assets/css/profile.css` → `styles/profile.css`
    - `assets/css/sell.css` → `styles/sell.css`

## Files Not Changed (But Considered)

- `lib/catUtils.js` - Not currently imported, but kept for potential future use
- `lib/categoryUtils.js` - Active file, used in multiple components

## Impact Summary

### Routes Changed
- `/manage` → `/my-ads` (user ad management)
- `/posting-ads` → `/posting-guide` (posting guidelines)

### NPM Scripts Updated
All database management scripts now use `database-manager.js`:
- `npm run db:migrate`
- `npm run db:migrate:dev`
- `npm run db:seed`
- `npm run db:reset`
- `npm run db:status`
- `npm run db:studio`
- `npm run db:generate`

### Import Paths Updated
- CSS imports: `assets/css/*` → `styles/*`
- All route references: `/manage` → `/my-ads`
- All route references: `/posting-ads` → `/posting-guide`

## Benefits

1. **Clearer Naming**: File names now clearly indicate their purpose
2. **Better Organization**: Styles moved to a simpler `styles/` folder
3. **Consistent Conventions**: Using kebab-case for script files
4. **Improved Readability**: Route names like `/my-ads` are more intuitive than `/manage`
5. **Better Documentation**: Updated comments and usage examples reflect new names

## Migration Notes

- All internal references have been updated
- External links to `/manage` or `/posting-ads` will need to be updated if they exist
- Database and functionality remain unchanged
- No breaking changes to API endpoints
