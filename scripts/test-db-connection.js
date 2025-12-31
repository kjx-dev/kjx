#!/usr/bin/env node

/**
 * Test Database Connection and Categories
 * This script verifies the database connection and shows what categories exist
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
try {
  require('dotenv').config({ path: ['.env.local', '.env'] });
} catch (_) {
  try {
    require('dotenv').config();
  } catch (__) {}
}

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Testing Database Connection');
  console.log('='.repeat(60) + '\n');

  // Check DATABASE_URL
  const dbUrl = process.env.DATABASE_URL || 'file:./db/dev.db';
  console.log(`📌 DATABASE_URL: ${dbUrl}\n`);

  // Check if database file exists
  const dbPath = dbUrl.replace(/^file:/, '').replace(/^["']|["']$/g, '');
  const fullDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(__dirname, '..', dbPath);
  
  if (fs.existsSync(fullDbPath)) {
    const stats = fs.statSync(fullDbPath);
    console.log(`✅ Database file exists: ${fullDbPath}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Modified: ${stats.mtime.toLocaleString()}\n`);
  } else {
    console.log(`❌ Database file NOT found: ${fullDbPath}\n`);
    return;
  }

  // Test Prisma connection
  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    await prisma.$connect();
    console.log('✅ Prisma Client connected successfully!\n');

    // Count categories
    const categoryCount = await prisma.category.count();
    console.log(`📊 Total Categories: ${categoryCount}`);

    // Get parent categories
    const parentCategories = await prisma.category.findMany({
      where: { parent_id: null },
      orderBy: { name: 'asc' }
    });
    console.log(`📁 Parent Categories: ${parentCategories.length}\n`);

    if (parentCategories.length > 0) {
      console.log('Parent Categories:');
      parentCategories.forEach((cat, i) => {
        console.log(`  ${i + 1}. ${cat.name} (ID: ${cat.category_id}, Icon: ${cat.icon})`);
      });
      console.log();
    }

    // Get categories with children
    const categoriesWithChildren = await Promise.all(
      parentCategories.slice(0, 5).map(async (parent) => {
        const children = await prisma.category.findMany({
          where: { parent_id: parent.category_id },
          orderBy: { name: 'asc' }
        });
        return { parent, children: children.length };
      })
    );

    console.log('Categories with Subcategories:');
    categoriesWithChildren.forEach(({ parent, children }) => {
      console.log(`  • ${parent.name}: ${children} subcategories`);
    });
    console.log();

    // Test API endpoint data structure
    const allCategories = await prisma.category.findMany({
      orderBy: { created_at: 'asc' }
    });
    const parents = allCategories.filter(c => c.parent_id == null);
    const groups = parents.map(p => ({
      parent: p,
      children: allCategories.filter(c => c.parent_id === p.category_id)
    }));

    console.log(`📦 Data Structure for API:`);
    console.log(`   - Total categories: ${allCategories.length}`);
    console.log(`   - Parent categories: ${parents.length}`);
    console.log(`   - Category groups: ${groups.length}`);
    console.log(`   - Groups with children: ${groups.filter(g => g.children.length > 0).length}\n`);

    if (groups.length > 0) {
      console.log('Sample Category Groups (first 3):');
      groups.slice(0, 3).forEach((group, i) => {
        console.log(`\n  Group ${i + 1}: ${group.parent.name}`);
        console.log(`    Subcategories: ${group.children.length}`);
        if (group.children.length > 0) {
          console.log(`    Examples: ${group.children.slice(0, 3).map(c => c.name).join(', ')}${group.children.length > 3 ? '...' : ''}`);
        }
      });
      console.log();
    }

    await prisma.$disconnect();
    console.log('✅ Database connection test completed!\n');

  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error(`   Error: ${error.message}\n`);
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

testConnection().catch(error => {
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});
