let prisma = null
export function getPrisma(){
  if (prisma) return prisma
  try{
    const { PrismaClient } = require('@prisma/client')
    prisma = new PrismaClient()
    return prisma
  }catch(e){
    return null
  }
}
