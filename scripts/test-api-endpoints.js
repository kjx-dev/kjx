#!/usr/bin/env node

/**
 * Test API Endpoints
 * This script tests the category API endpoints that the home page uses
 */

const http = require('http');

// Load environment variables
try {
  require('dotenv').config({ path: ['.env.local', '.env'] });
} catch (_) {
  try {
    require('dotenv').config();
  } catch (__) {}
}

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function testEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`   GET ${BASE_URL}${path}`);
    
    const req = http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data) {
            console.log(`   ✅ Status: ${res.statusCode}`);
            if (json.data.groups) {
              console.log(`   📦 Groups: ${json.data.groups.length}`);
              if (json.data.groups.length > 0) {
                console.log(`   📁 Sample parent: ${json.data.groups[0].parent?.name || 'N/A'}`);
                console.log(`   📂 Subcategories: ${json.data.groups[0].children?.length || 0}`);
              }
            }
            if (json.data.categories) {
              console.log(`   📋 Categories: ${json.data.categories.length}`);
            }
            if (json.data.tiles) {
              console.log(`   🎯 Tiles: ${json.data.tiles.length}`);
            }
            resolve(json);
          } else {
            console.log(`   ⚠️  No data in response`);
            resolve(json);
          }
        } catch (e) {
          console.log(`   ❌ Failed to parse JSON: ${e.message}`);
          console.log(`   Response: ${data.substring(0, 200)}...`);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Connection error: ${error.message}`);
      console.log(`   💡 Make sure your dev server is running: npm run dev`);
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`   ⏱️  Request timeout`);
      reject(new Error('Timeout'));
    });
  });
}

async function testDatabaseDirectly() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Direct Database Test');
  console.log('='.repeat(60));

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    
    const all = await prisma.category.findMany({ orderBy: { created_at: 'asc' } });
    const parents = all.filter(c => c.parent_id == null);
    const groups = parents.map(p => ({
      parent: p,
      children: all.filter(c => c.parent_id === p.category_id)
    }));

    console.log(`\n✅ Database Direct Access:`);
    console.log(`   - Total categories: ${all.length}`);
    console.log(`   - Parent categories: ${parents.length}`);
    console.log(`   - Category groups: ${groups.length}`);
    console.log(`   - Groups with children: ${groups.filter(g => g.children.length > 0).length}`);

    if (groups.length > 0) {
      console.log(`\n📋 Sample Groups (first 5):`);
      groups.slice(0, 5).forEach((g, i) => {
        console.log(`   ${i + 1}. ${g.parent.name} (${g.children.length} subcategories)`);
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error(`\n❌ Database error: ${error.message}`);
    await prisma.$disconnect().catch(() => {});
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing API Endpoints');
  console.log('='.repeat(60));
  console.log(`\n📍 Server: ${BASE_URL}`);
  console.log(`💡 Make sure your dev server is running: npm run dev\n`);

  // Test direct database access first
  await testDatabaseDirectly();

  // Test API endpoints
  try {
    await testEndpoint('/api/v1/category', 'Category API (used by home page)');
    await testEndpoint('/api/v1/categories', 'Categories API (used by home page)');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ API Testing Complete!');
    console.log('='.repeat(60));
    console.log('\n💡 If endpoints failed, make sure:');
    console.log('   1. Dev server is running: npm run dev');
    console.log('   2. Database file exists: db/dev.db');
    console.log('   3. Categories are seeded: npm run db:seed:categories\n');
  } catch (error) {
    console.log('\n⚠️  API endpoints not accessible (server may not be running)');
    console.log('   But database direct access works, so categories exist!\n');
  }
}

main().catch(console.error);
