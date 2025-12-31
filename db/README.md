# Database Files Directory

All database-related files are organized in this `db/` folder:

## Structure

```
db/
├── schema.prisma      # Prisma schema definition
├── seed.js            # Database seed functions
├── migrations/        # Database migrations
│   └── [timestamp]_[name]/
│       └── migration.sql
├── dev.db            # SQLite database file (auto-generated)
├── auth.js           # Authentication utilities (used by seed.js)
└── client.js         # Prisma client setup
```

## Quick Start

```bash
# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Create new migration
npm run db:migrate:dev migration_name
```

## Files

- **schema.prisma**: Your Prisma schema definition. Edit this file to change your database structure.
- **seed.js**: Contains seed functions (`seedDemo`, `resetCategories`) to populate your database with initial data.
- **migrations/**: Contains all database migration files. Each migration is in its own timestamped folder.

For more information, see:
- [DATABASE.md](../DATABASE.md) - Quick reference
- [docs/DATABASE_MANAGEMENT.md](../docs/DATABASE_MANAGEMENT.md) - Complete documentation
