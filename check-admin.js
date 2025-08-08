// Check admin account in production database
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

async function checkAdmin() {
  try {
    console.log('🔍 Checking admin accounts in production...')
    
    const admins = await prisma.admin.findMany()
    console.log('📊 Found admins:', admins.length)
    
    for (const admin of admins) {
      console.log('👤 Admin:', { id: admin.id, username: admin.username })
      
      // Test password
      const isValid = await bcrypt.compare('admin123', admin.password)
      console.log('🔐 Password check for', admin.username + ':', isValid ? '✅ Valid' : '❌ Invalid')
    }
    
    if (admins.length === 0) {
      console.log('⚠️  No admin accounts found! Creating one...')
      
      const hashedPassword = await bcrypt.hash('admin123', 10)
      const newAdmin = await prisma.admin.create({
        data: {
          username: 'admin',
          password: hashedPassword
        }
      })
      
      console.log('✅ Created admin:', { id: newAdmin.id, username: newAdmin.username })
    }
    
  } catch (error) {
    console.error('❌ Error checking admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()