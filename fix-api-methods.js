const fs = require('fs')
const path = require('path')

const apiRoutes = ['units', 'partners', 'contracts', 'safes', 'brokers']

const putMethod = `
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'معرف العنصر مطلوب'
      }, { status: 400 })
    }

    const item = await prisma.${'${route}'}.update({
      where: { id },
      data: body
    })

    // Invalidate cache
    cache.delete('${'${route}'}-list')

    return NextResponse.json({
      success: true,
      data: item,
      message: 'تم التحديث بنجاح'
    })

  } catch (error) {
    console.error('Error updating item:', error)
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في التحديث'
    }, { status: 500 })
  }
}`

const deleteMethod = `
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'معرف العنصر مطلوب'
      }, { status: 400 })
    }

    // Soft delete
    await prisma.${'${route}'}.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Invalidate cache
    cache.delete('${'${route}'}-list')

    return NextResponse.json({
      success: true,
      message: 'تم الحذف بنجاح'
    })

  } catch (error) {
    console.error('Error deleting item:', error)
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الحذف'
    }, { status: 500 })
  }
}`

apiRoutes.forEach(route => {
  const filePath = `src/app/api/${route}/route.ts`
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Remove prisma.$disconnect() calls
    content = content.replace(/  } finally {\s*await prisma\.\$disconnect\(\)\s*}\s*$/, '  }')
    
    // Add PUT and DELETE methods if they don't exist
    if (!content.includes('export async function PUT')) {
      content = content.replace(/(export async function POST[\s\S]*?^}$)/m, `$1${putMethod.replace(/\$\{route\}/g, route)}`)
    }
    
    if (!content.includes('export async function DELETE')) {
      content = content.replace(/(export async function PUT[\s\S]*?^}$)/m, `$1${deleteMethod.replace(/\$\{route\}/g, route)}`)
    }
    
    fs.writeFileSync(filePath, content)
    console.log(`✅ Fixed ${filePath}`)
  }
})

console.log('🎉 All API routes fixed with PUT and DELETE methods!')