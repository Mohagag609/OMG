import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      users
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, email, role = 'user', adminKey } = body

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username and password are required'
        },
        { status: 400 }
      )
    }

    // Check admin key for user creation
    const requiredAdminKey = process.env.ADMIN_CREATION_KEY || 'ADMIN_SECRET_2024'
    if (!adminKey || adminKey !== requiredAdminKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid admin key. User creation is restricted.'
        },
        { status: 403 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username already exists'
        },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email: email || null,
        role
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      user,
      message: 'User created successfully'
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}