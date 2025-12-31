#!/usr/bin/env node

/**
 * Database Management Script
 * 
 * This script provides easy commands for managing database migrations and seeds.
 * 
 * Usage:
 *   node scripts/db-manage.js migrate      - Run pending migrations
 *   node scripts/db-manage.js migrate:dev  - Create a new migration
 *   node scripts/db-manage.js seed         - Run seeds
 *   node scripts/db-manage.js reset        - Reset database and reseed
 *   node scripts/db-manage.js status       - Check migration status
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
try {
  require('dotenv').config({ path: ['.env.local', '.env'] });
} catch (_) {
  try {
    require('dotenv').config();
  } catch (__) {}
}

const PRISMA_SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.prisma');
const SEED_PATH = path.join(__dirname, '..', 'db', 'seed.js');

function runCommand(command, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 ${description}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log(`\n✅ ${description} completed successfully!\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${description} failed!\n`);
    console.error(error.message);
    process.exit(1);
  }
}

function checkSchemaExists() {
  if (!fs.existsSync(PRISMA_SCHEMA_PATH)) {
    console.error(`❌ Error: Schema file not found at ${PRISMA_SCHEMA_PATH}`);
    console.error('Please ensure your Prisma schema exists in the db/ directory.');
    process.exit(1);
  }
}

function getSchemaFlag() {
  return `--schema ${PRISMA_SCHEMA_PATH}`;
}

async function migrate() {
  checkSchemaExists();
  console.log('🔄 Running database migrations...\n');
  runCommand(`npx prisma migrate deploy ${getSchemaFlag()}`, 'Migration');
}

async function migrateDev(migrationName) {
  checkSchemaExists();
  const name = migrationName || 'auto';
  console.log(`🔄 Creating new migration: ${name}...\n`);
  runCommand(`npx prisma migrate dev --name ${name} ${getSchemaFlag()}`, `Creating migration: ${name}`);
}

async function generateClient(suppressErrors = false) {
  checkSchemaExists();
  console.log('🔄 Generating Prisma Client...\n');
  try {
    execSync(`npx prisma generate ${getSchemaFlag()}`, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log(`\n✅ Prisma Client generated successfully!\n`);
    return true;
  } catch (error) {
    if (suppressErrors) {
      console.warn('⚠️  Could not generate Prisma Client - file may be locked by running process');
      console.warn('   Client may already be generated. Continuing...\n');
      return false;
    }
    console.error(`\n❌ Generate Prisma Client failed!\n`);
    console.error(error.message);
    throw error;
  }
}

async function seed() {
  checkSchemaExists();
  
  if (!fs.existsSync(SEED_PATH)) {
    console.error(`❌ Error: Seed file not found at ${SEED_PATH}`);
    process.exit(1);
  }

  // Try to generate Prisma Client (may fail if locked, that's okay if already generated)
  await generateClient(true); // suppressErrors = true
  
  console.log('🌱 Running database seeds...\n');
  
  // Import and run seed function (using dynamic import for ES modules)
  // Convert Windows path to file:// URL for dynamic import
  const seedPathUrl = path.isAbsolute(SEED_PATH) 
    ? `file:///${SEED_PATH.replace(/\\/g, '/')}` 
    : `file:///${path.resolve(SEED_PATH).replace(/\\/g, '/')}`;
  const { seedDemo } = await import(seedPathUrl);
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');
    
    const result = await seedDemo(prisma);
    console.log('\n✅ Seed completed successfully!');
    console.log(`   - Created ${result.users?.length || 0} users`);
    console.log(`   - Created ${result.categories?.length || 0} categories`);
    console.log(`   - Created ${result.posts?.length || 0} posts\n`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Seed failed!');
    console.error(error.message);
    if (error.stack) console.error(error.stack);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

async function seedCategories() {
  checkSchemaExists();
  
  if (!fs.existsSync(SEED_PATH)) {
    console.error(`❌ Error: Seed file not found at ${SEED_PATH}`);
    process.exit(1);
  }

  // Try to generate Prisma Client (may fail if locked, that's okay if already generated)
  console.log('🔄 Ensuring Prisma Client is available...\n');
  try {
    await generateClient(true); // suppressErrors = true
  } catch (error) {
    console.warn('⚠️  Client generation failed - continuing with existing client\n');
  }
  
  console.log('🌱 Resetting and seeding categories...\n');
  
  // Import using dynamic import for ES modules
  // Convert Windows path to file:// URL for dynamic import
  const seedPathUrl = path.isAbsolute(SEED_PATH) 
    ? `file:///${SEED_PATH.replace(/\\/g, '/')}` 
    : `file:///${path.resolve(SEED_PATH).replace(/\\/g, '/')}`;
  const { resetCategories } = await import(seedPathUrl);
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');
    
    const result = await resetCategories(prisma);
    console.log('\n✅ Categories seeded successfully!');
    console.log(`   - Created ${result?.length || 0} categories\n`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Category seed failed!');
    console.error(error.message);
    if (error.stack) console.error(error.stack);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

async function reset() {
  checkSchemaExists();
  
  console.log('⚠️  WARNING: This will reset your database!');
  console.log('   All data will be deleted and the database will be reseeded.\n');
  
  console.log('🔄 Resetting database...\n');
  
  // Drop database (SQLite specific - just delete the file)
  // Handle both relative and absolute paths
  let dbPath = process.env.DATABASE_URL?.replace('file:', '').replace(/^["']|["']$/g, '') || 'db/dev.db';
  // If path starts with ./, resolve it relative to project root
  if (dbPath.startsWith('./')) {
    dbPath = dbPath.substring(2);
  }
  const fullDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(__dirname, '..', dbPath);
  
  if (fs.existsSync(fullDbPath)) {
    try {
      // Close any existing connections first by deleting the file
      fs.unlinkSync(fullDbPath);
      console.log(`✅ Deleted database file: ${dbPath}\n`);
      // Wait a moment for file system to sync
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn(`⚠️  Could not delete database file: ${error.message}`);
      console.warn('   Make sure no applications are using the database.\n');
    }
  }
  
  // Use db push to create database from schema (simpler than migrations for reset)
  console.log('🔄 Creating database from schema...\n');
  try {
    runCommand(`npx prisma db push --skip-generate --force-reset ${getSchemaFlag()}`, 'Create Database from Schema');
    
    // Try to generate Prisma Client (may fail if locked, that's okay)
    console.log('\n🔄 Attempting to generate Prisma Client...\n');
    try {
      await generateClient(true); // suppressErrors = true
    } catch (genError) {
      console.warn('\n⚠️  Prisma Client generation skipped (file may be locked)');
      console.warn('   If seeding fails, stop any running Node processes and run: npm run db:generate\n');
    }
    
    // Seed categories first (full category tree with subcategories)
    console.log('\n🌱 Seeding categories with subcategories...\n');
    await seedCategories();
    
    // Then seed demo data (users and posts) 
    console.log('\n🌱 Seeding demo data (users and posts)...\n');
    await seed();
  } catch (error) {
    console.error('\n❌ Reset failed!');
    console.error('If you want to use migrations instead, run: npm run db:migrate:dev');
    process.exit(1);
  }
}

async function status() {
  checkSchemaExists();
  console.log('📊 Checking database status...\n');
  
  try {
    // Generate client first
    await generateClient();
    
    // Try to connect and check status
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    console.log('✅ Database connection successful\n');
    
    // Get migration status
    try {
      execSync(`npx prisma migrate status ${getSchemaFlag()}`, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
    } catch (_) {
      // If migrate status fails, that's okay
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error(error.message);
    process.exit(1);
  }
}

async function studio() {
  checkSchemaExists();
  console.log('🎨 Opening Prisma Studio...\n');
  runCommand(`npx prisma studio ${getSchemaFlag()}`, 'Prisma Studio');
}

// Main command handler
const command = process.argv[2];
const arg = process.argv[3];

async function main() {
  switch (command) {
    case 'migrate':
      await migrate();
      break;
    
    case 'migrate:dev':
    case 'migration:create':
      await migrateDev(arg);
      break;
    
    case 'generate':
      await generateClient();
      break;
    
    case 'seed':
      await seed();
      break;
    
    case 'seed:categories':
      await seedCategories();
      break;
    
    case 'reset':
      await reset();
      break;
    
    case 'status':
      await status();
      break;
    
    case 'studio':
      await studio();
      break;
    
    default:
      console.log(`
📦 Database Management Script

Usage: node scripts/db-manage.js <command> [options]

Commands:
  migrate              Run pending migrations
  migrate:dev [name]   Create a new migration (with optional name)
  generate             Generate Prisma Client
  seed                 Run database seeds
  seed:categories      Reset and seed categories only
  reset                Reset database (delete, migrate, seed)
  status               Check database and migration status
  studio               Open Prisma Studio

Examples:
  node scripts/db-manage.js migrate
  node scripts/db-manage.js migrate:dev add_user_role
  node scripts/db-manage.js seed
  node scripts/db-manage.js reset
  node scripts/db-manage.js status
`);
      process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});
