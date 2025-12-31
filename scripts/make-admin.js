const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: ['.env.local', '.env'] })

async function makeAdmin() {
  const prisma = new PrismaClient()
  
  try {
    const email = 'kamransuleman9@gmail.com'
    
    console.log(`Looking for user with email: ${email}`)
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      console.error(`❌ User with email ${email} not found in database`)
      console.log('\nAvailable users:')
      const allUsers = await prisma.user.findMany({
        select: { email: true, username: true, role: true }
      })
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.username}) - Role: ${u.role}`)
      })
      process.exit(1)
    }
    
    console.log(`Found user: ${user.username} (ID: ${user.user_id})`)
    console.log(`Current role: ${user.role}`)
    
    if (user.role === 'admin') {
      console.log('✅ User is already an admin!')
      await prisma.$disconnect()
      return
    }
    
    // Update to admin
    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'admin' }
    })
    
    console.log(`✅ Successfully updated user to admin!`)
    console.log(`   Email: ${updated.email}`)
    console.log(`   Username: ${updated.username}`)
    console.log(`   Role: ${updated.role}`)
    
  } catch (error) {
    console.error('❌ Error updating user:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

makeAdmin()
