// PM2 ecosystem configuration لمدير الاستثمار العقاري

module.exports = {
  apps: [
    {
      name: 'estate-management',
      script: 'npm',
      args: 'start',
      cwd: '/workspace',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        TZ: 'Africa/Cairo'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        TZ: 'Africa/Cairo',
        LOG_LEVEL: 'info',
        ENABLE_METRICS: 'true',
        ENABLE_HEALTH_CHECKS: 'true',
        ENABLE_AUDIT_LOGS: 'true',
        ENABLE_BACKUPS: 'true',
        ENABLE_NOTIFICATIONS: 'true'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        TZ: 'Africa/Cairo',
        LOG_LEVEL: 'debug'
      },
      // إعدادات الأداء
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // إعدادات السجلات
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // إعدادات المراقبة
      monitoring: true,
      pmx: true,
      
      // إعدادات التحديث التلقائي
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        '.next',
        'uploads'
      ],
      
      // إعدادات الشبكة
      listen_timeout: 3000,
      kill_timeout: 5000,
      
      // إعدادات الذاكرة
      node_args: '--max-old-space-size=1024',
      
      // إعدادات الأمان
      uid: 'www-data',
      gid: 'www-data',
      
      // إعدادات التخزين المؤقت
      merge_logs: true,
      
      // إعدادات الإشعارات
      notify: true,
      
      // إعدادات النسخ الاحتياطية
      backup: {
        enabled: true,
        interval: '0 2 * * *', // يومياً في الساعة 2 صباحاً
        max_backups: 7,
        backup_path: './backups'
      }
    }
  ],

  // إعدادات النشر
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/username/estate-management.git',
      path: '/var/www/estate-management',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'ubuntu',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/username/estate-management.git',
      path: '/var/www/estate-management-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
}