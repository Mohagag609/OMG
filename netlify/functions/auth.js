const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight' })
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const { username, password } = JSON.parse(event.body)
      
      // Simple authentication (replace with your actual auth logic)
      if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign(
          { username, id: '1' },
          process.env.NEXTAUTH_SECRET || 'fallback-secret',
          { expiresIn: '24h' }
        )
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: { token },
            message: 'تم تسجيل الدخول بنجاح'
          })
        }
      } else {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
          })
        }
      }
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'خطأ في الخادم'
        })
      }
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  }
}