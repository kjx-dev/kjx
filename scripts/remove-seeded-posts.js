const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: ['.env.local', '.env'] })

async function removeSeededPosts() {
  const prisma = new PrismaClient()
  
  try {
    // Find demo users (alice and bob)
    const demoUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'alice@example.com' },
          { email: 'bob@example.com' },
          { username: 'alice' },
          { username: 'bob' }
        ]
      }
    })
    
    if (demoUsers.length === 0) {
      console.log('No demo users found. No seeded posts to remove.')
      await prisma.$disconnect()
      return
    }
    
    const demoUserIds = demoUsers.map(u => u.user_id)
    console.log(`Found ${demoUsers.length} demo user(s):`)
    demoUsers.forEach(u => {
      console.log(`  - ${u.username} (${u.email}) - ID: ${u.user_id}`)
    })
    
    // Find all posts created by demo users
    const posts = await prisma.post.findMany({
      where: {
        user_id: { in: demoUserIds }
      },
      select: {
        post_id: true,
        title: true,
        user_id: true
      }
    })
    
    if (posts.length === 0) {
      console.log('\n✅ No seeded posts found. Database is clean.')
      await prisma.$disconnect()
      return
    }
    
    console.log(`\nFound ${posts.length} seeded post(s) to delete:`)
    posts.forEach(p => {
      const user = demoUsers.find(u => u.user_id === p.user_id)
      console.log(`  - Post ID ${p.post_id}: "${p.title}" by ${user?.username || 'unknown'}`)
    })
    
    // Delete related data first (due to foreign key constraints)
    const postIds = posts.map(p => p.post_id)
    
    console.log('\nDeleting related data...')
    await prisma.postBid.deleteMany({ where: { post_id: { in: postIds } } })
    await prisma.postReview.deleteMany({ where: { post_id: { in: postIds } } })
    await prisma.postImage.deleteMany({ where: { post_id: { in: postIds } } })
    await prisma.favorite.deleteMany({ where: { post_id: { in: postIds } } })
    await prisma.chatMessage.deleteMany({ where: { post_id: { in: postIds } } })
    await prisma.postFlag.deleteMany({ where: { post_id: { in: postIds } } })
    
    // Delete the posts
    console.log('Deleting posts...')
    const result = await prisma.post.deleteMany({
      where: {
        user_id: { in: demoUserIds }
      }
    })
    
    console.log(`\n✅ Successfully deleted ${result.count} seeded post(s)!`)
    
  } catch (error) {
    console.error('❌ Error removing seeded posts:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

removeSeededPosts()
