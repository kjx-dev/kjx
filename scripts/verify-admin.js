const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: ['.env.local', '.env'] })

async function verifyAdmin() {
  const prisma = new PrismaClient()
  
  try {
    const user = await prisma.user.findUnique({ 
      where: { email: 'kamransuleman9@gmail.com' },
      select: { user_id: true, username: true, email: true, role: true }
    })
    
    if (user) {
      console.log('✅ Admin user found:')
      console.log(JSON.stringify(user, null, 2))
    } else {
      console.log('❌ Admin user not found!')
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAdmin()
