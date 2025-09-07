-- إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إدراج مستخدم افتراضي
INSERT INTO users (username, password, email, full_name, role) 
VALUES (
    'admin', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'admin@estate.com',
    'مدير النظام',
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- إدراج مستخدم إضافي
INSERT INTO users (username, password, email, full_name, role) 
VALUES (
    'user', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'user@estate.com',
    'مستخدم عادي',
    'user'
) ON CONFLICT (username) DO NOTHING;

-- عرض المستخدمين
SELECT id, username, email, full_name, role, is_active, created_at FROM users;