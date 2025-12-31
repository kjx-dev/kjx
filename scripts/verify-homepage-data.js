#!/usr/bin/env node

/**
 * Verify Homepage Data Structure
 * This script verifies that the data structure matches what the homepage expects
 */

// Load environment variables
try {
  require('dotenv').config({ path: ['.env.local', '.env'] });
} catch (_) {
  try {
    require('dotenv').config();
  } catch (__) {}
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function verifyHomepageData() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Verifying Homepage Data Structure');
  console.log('='.repeat(60) + '\n');

  try {
    await prisma.$connect();

    // Simulate /api/v1/category endpoint
    const allCategories = await prisma.category.findMany({ orderBy: { created_at: 'asc' } });
    const parents = allCategories.filter(c => c.parent_id == null);
    const groups = parents.map(p => ({
      parent: p,
      children: allCategories.filter(c => c.parent_id === p.category_id)
    }));

    const tiles = [
      { k: 'Mobile Phones', label: 'Mobiles', icon: 'fa-mobile-screen', shortLabel: 'Mobiles' },
      { k: 'Cars', label: 'Vehicles', icon: 'fa-car', shortLabel: 'Vehicles' },
      { k: 'Motercycles', label: 'Bikes', icon: 'fa-motorcycle', shortLabel: 'Bikes' },
      { k: 'Property for Sale', label: 'Property for Sale', icon: 'fa-house', shortLabel: 'Property for Sale' },
      { k: 'Property for Rent', label: 'Property for Rent', icon: 'fa-key', shortLabel: 'Property for Rent' },
      { k: 'Tv - Video - Audio', label: 'Electronics', icon: 'fa-tv', shortLabel: 'Electronics' },
      { k: 'Tablets', label: 'Tablets', icon: 'fa-tablet-screen-button', shortLabel: 'Tablets' },
      { k: 'Jobs', label: 'Jobs', icon: 'fa-briefcase', shortLabel: 'Jobs' },
      { k: 'Services', label: 'Services', icon: 'fa-paint-roller', shortLabel: 'Services' },
      { k: 'Furniture', label: 'Furniture', icon: 'fa-chair', shortLabel: 'Furniture' }
    ];

    const seen = new Set();
    const uniqTiles = [];
    for (const t of tiles) {
      const key = slugify(t.k);
      if (!seen.has(key)) {
        seen.add(key);
        uniqTiles.push(t);
      }
    }

    console.log('📊 /api/v1/category Response Structure:');
    console.log(`   - categories: ${allCategories.length} items`);
    console.log(`   - tiles: ${uniqTiles.length} items`);
    console.log(`   - groups: ${groups.length} items\n`);

    console.log('🎯 Tiles (used by CategoryGrid):');
    uniqTiles.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.label} (${t.k}) - ${t.icon}`);
    });
    console.log();

    console.log('📁 Groups (used by CategoryGrid as fallback):');
    groups.slice(0, 5).forEach((g, i) => {
      console.log(`   ${i + 1}. ${g.parent.name} (${g.children.length} subcategories)`);
    });
    console.log();

    // Simulate getOrderedCategories logic (simplified)
    let categoriesToSort = [];
    if (Array.isArray(uniqTiles) && uniqTiles.length > 0) {
      categoriesToSort = uniqTiles;
    } else if (Array.isArray(groups) && groups.length > 0) {
      categoriesToSort = groups.map(g => ({
        k: g.parent.name,
        label: g.parent.name,
        icon: g.parent.icon
      }));
    }

    console.log('✅ CategoryGrid Input:');
    console.log(`   - catTiles: ${uniqTiles.length} items`);
    console.log(`   - catGroups: ${groups.length} items`);
    console.log(`   - Categories to display: ${categoriesToSort.length}`);
    if (categoriesToSort.length > 0) {
      console.log(`   - First 10 categories:`);
      categoriesToSort.slice(0, 10).forEach((c, i) => {
        console.log(`     ${i + 1}. ${c.label || c.k} (${c.k})`);
      });
    } else {
      console.log(`   ⚠️  WARNING: No categories to display!`);
      console.log(`   - This would cause "Loading categories..." to show`);
    }
    console.log();

    // Simulate /api/v1/categories endpoint
    const allCats2 = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    const parents2 = allCats2.filter(c => c.parent_id == null);
    const groups2 = parents2.map(p => {
      const children = allCats2.filter(c => c.parent_id === p.category_id);
      return {
        parent: p,
        children: children.map(child => ({
          ...child,
          subchildren: allCats2.filter(sc => sc.parent_id === child.category_id)
        }))
      };
    });

    console.log('📊 /api/v1/categories Response Structure:');
    console.log(`   - categories: ${allCats2.length} items`);
    console.log(`   - groups: ${groups2.length} items\n`);

    console.log('='.repeat(60));
    console.log('✅ Verification Complete!');
    console.log('='.repeat(60));
    console.log('\n💡 If CategoryGrid shows "Loading categories...":');
    console.log('   1. Clear browser localStorage');
    console.log('   2. Hard refresh the page (Ctrl+Shift+R)');
    console.log('   3. Check browser console for errors');
    console.log('   4. Verify API responses in Network tab\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

verifyHomepageData().catch(console.error);
