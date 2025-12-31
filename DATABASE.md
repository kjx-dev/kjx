# Database Management - Quick Reference

## 🚀 Quick Commands

```bash
# Setup (first time)
npm run db:migrate && npm run db:seed

# Create new migration
npm run db:migrate:dev your_migration_name

# Reset everything (⚠️ deletes all data)
npm run db:reset

# Check status
npm run db:status

# Visual database browser
npm run db:studio
```

## 📚 Full Documentation

See [docs/DATABASE_MANAGEMENT.md](docs/DATABASE_MANAGEMENT.md) for complete documentation.

## 🎯 Common Workflows

### Making Schema Changes
1. Edit `db/schema.prisma`
2. Run `npm run db:migrate:dev add_field_name`
3. Review the generated migration
4. Run `npm run db:migrate` to apply

### Adding Seed Data
1. Edit `db/seed.js`
2. Run `npm run db:seed` to test

### Fresh Start
```bash
npm run db:reset  # Deletes database, runs migrations, seeds data
```
