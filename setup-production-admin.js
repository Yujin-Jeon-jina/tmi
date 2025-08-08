// Production admin setup script
const DATABASE_URL = "postgresql://neondb_owner:npg_SPqNUyGjw13R@ep-summer-hall-af439ocg-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
})

async function setupProductionAdmin() {
  try {
    console.log('🔧 Setting up production admin...')
    
    // 기존 관리자 확인
    const existingAdmins = await prisma.admin.findMany()
    console.log('📊 Existing admins:', existingAdmins.length)
    
    // 기존 관리자 삭제
    if (existingAdmins.length > 0) {
      await prisma.admin.deleteMany({})
      console.log('🗑️  Deleted existing admins')
    }
    
    // 새 관리자 생성
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.admin.create({
      data: {
        username: 'admin',
        password: hashedPassword
      }
    })
    
    console.log('✅ Production admin created:', { id: admin.id, username: admin.username })
  } catch (error) {
    console.error('❌ Error setting up production admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupProductionAdmin()