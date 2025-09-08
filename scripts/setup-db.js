const { PrismaClient } = require('@prisma/client')

async function setupDatabase() {
  const prisma = new PrismaClient()

  try {
    console.log('Setting up database...')

    // Check if we're in production (Netlify/Vercel)
    const isProduction = process.env.NODE_ENV === 'production'
    const databaseUrl = process.env.DATABASE_URL

    if (isProduction && databaseUrl && !databaseUrl.startsWith('file:')) {
      console.log('Production environment detected with PostgreSQL URL')
      // Skip database setup in production as it should be handled by the hosting platform
      console.log('Skipping database setup in production environment')
      return
    }

    // Push the schema to create tables
    const { execSync } = require('child_process')
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })

    console.log('Database setup completed successfully!')
  } catch (error) {
    console.error('Error setting up database:', error)
    // Don't exit in production to allow the build to continue
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1)
    } else {
      console.log('Continuing build despite database setup error in production')
    }
  } finally {
    await prisma.$disconnect()
  }
}

setupDatabase()