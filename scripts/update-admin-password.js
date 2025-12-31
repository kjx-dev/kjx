const { PrismaClient } = require('@prisma/client')
const { hashPassword } = require('../lib/auth.js')
require('dotenv').config({ path: ['.env.local', '.env'] })

async function updateAdminPassword() {
  const prisma = new PrismaClient()
  
  try {
    const email = 'kamransuleman9@gmail.com'
    const newPassword = 'Fireon5253'
    
    console.log(`Updating password for admin user: ${email}`)
    
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      console.error(`❌ User with email ${email} not found`)
      process.exit(1)
    }
    
    const updated = await prisma.user.update({
      where: { email },
      data: { password_hash: hashPassword(newPassword) }
    })
    
    console.log(`✅ Successfully updated admin password!`)
    console.log(`   Email: ${updated.email}`)
    console.log(`   Username: ${updated.username}`)
    console.log(`   Role: ${updated.role}`)
    
  } catch (error) {
    console.error('❌ Error updating password:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateAdminPassword()
