import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '24h'

export interface User {
  id: string
  username: string
  role: 'admin' | 'user'
}

export interface JWTPayload {
  userId: string
  username: string
  role: string
  iat: number
  exp: number
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate JWT token
export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

// Extract token from request
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

// Get user from request
export function getUserFromRequest(request: NextRequest): User | null {
  const token = extractToken(request)
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  return {
    id: payload.userId,
    username: payload.username,
    role: payload.role as 'admin' | 'user'
  }
}

// Check if user has permission
export function hasPermission(user: User | null, requiredRole: 'admin' | 'user'): boolean {
  if (!user) return false
  
  if (requiredRole === 'admin') {
    return user.role === 'admin'
  }
  
  return true // 'user' role can access user-level resources
}

// Middleware for protected routes
export function requireAuth(requiredRole: 'admin' | 'user' = 'user') {
  return function(request: NextRequest): { user: User; error?: never } | { user?: never; error: string } {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return { error: 'غير مخول للوصول' }
    }
    
    if (!hasPermission(user, requiredRole)) {
      return { error: 'غير مخول للوصول' }
    }
    
    return { user }
  }
}