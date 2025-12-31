# Database Management Guide

This guide explains how to manage database migrations and seeds in this project.

## Quick Start

### Setup Database (First Time)
```bash
# Run migrations to create database schema
npm run db:migrate

# Seed the database with initial data
npm run db:seed
```

### Common Operations

#### Run Migrations
```bash
# Apply pending migrations
npm run db:migrate
```

#### Create a New Migration
```bash
# Create a new migration after modifying schema.prisma
npm run db:migrate:dev [migration-name]

# Example:
npm run db:migrate:dev add_user_profile_fields
```

#### Seed Database
```bash
# Seed with demo data (users, categories, posts)
npm run db:seed

# Seed only categories (resets categories and creates full category tree)
npm run db:seed:categories
```

#### Reset Database
```bash
# WARNING: This will delete all data and recreate the database
npm run db:reset
```

#### Check Database Status
```bash
# Check migration status and database connection
npm run db:status
```

#### Open Prisma Studio
```bash
# Open visual database browser
npm run db:studio
```

#### Generate Prisma Client
```bash
# Generate Prisma Client after schema changes
npm run db:generate
```

## Available Scripts

All database management is handled through npm scripts in `package.json`:

| Script | Command | Description |
|--------|---------|-------------|
| `db:migrate` | `npm run db:migrate` | Apply pending migrations |
| `db:migrate:dev` | `npm run db:migrate:dev [name]` | Create new migration |
| `db:seed` | `npm run db:seed` | Run database seeds |
| `db:seed:categories` | `npm run db:seed:categories` | Seed categories only |
| `db:reset` | `npm run db:reset` | Reset and reseed database |
| `db:status` | `npm run db:status` | Check database status |
| `db:studio` | `npm run db:studio` | Open Prisma Studio |
| `db:generate` | `npm run db:generate` | Generate Prisma Client |

## Workflow

### 1. Making Schema Changes

1. Edit `db/schema.prisma` with your changes
2. Create a migration:
   ```bash
   npm run db:migrate:dev add_descriptive_name
   ```
3. The migration will be created in `db/migrations/`
4. Review the migration SQL if needed
5. Apply migrations:
   ```bash
   npm run db:migrate
   ```

### 2. Adding Seed Data

Edit `db/seed.js` to add or modify seed data. The file exports two functions:
- `seedDemo(prisma)` - Seeds demo users, categories, and posts
- `resetCategories(prisma)` - Resets and seeds only categories

### 3. Development Workflow

During development, you might frequently reset and reseed:
```bash
# Reset everything and start fresh
npm run db:reset
```

## File Structure

```
├── db/
│   ├── schema.prisma          # Prisma schema definition
│   ├── seed.js                # Seed data functions
│   ├── migrations/            # Migration files
│   │   └── [timestamp]_[name]/
│   │       └── migration.sql
│   └── dev.db                 # SQLite database file (if using file database)
└── scripts/
    └── db-manage.js           # Database management script
```

## Troubleshooting

### Migration Issues

If migrations fail:
1. Check your `DATABASE_URL` environment variable
2. Verify the schema file is correct: `db/schema.prisma`
3. Check migration status: `npm run db:status`

### Seed Issues

If seeding fails:
1. Ensure migrations are up to date: `npm run db:migrate`
2. Check that Prisma Client is generated: `npm run db:generate`
3. Verify database connection

### Schema Sync Issues

If your database is out of sync:
1. Check migration status: `npm run db:status`
2. Run pending migrations: `npm run db:migrate`
3. If needed, reset: `npm run db:reset` (⚠️ deletes all data)

## Environment Variables

Make sure you have `DATABASE_URL` set in your `.env` or `.env.local` file:

```env
DATABASE_URL="file:./db/dev.db"
```

For production, use your production database URL.

## Notes

- The database management script automatically handles Prisma Client generation
- All database files are organized in the `db/` directory:
  - `db/schema.prisma` - Schema definition
  - `db/migrations/` - Migration files
  - `db/seed.js` - Seed data
- Never edit migration files directly after they've been applied
- Always create new migrations for schema changes
- Use `db:reset` with caution in production environments
