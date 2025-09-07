# Dockerfile لمدير الاستثمار العقاري

# استخدام Node.js 18 كصورة أساسية
FROM node:18-alpine AS base

# تثبيت التبعيات المطلوبة
RUN apk add --no-cache libc6-compat
WORKDIR /app

# نسخ ملفات التبعيات
COPY package*.json ./
COPY prisma ./prisma/

# تثبيت التبعيات
FROM base AS deps
RUN npm ci --only=production

# بناء التطبيق
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# تشغيل التطبيق
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# إنشاء مستخدم غير root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# نسخ الملفات المطلوبة
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# تغيير ملكية الملفات
RUN chown -R nextjs:nodejs /app
USER nextjs

# تعيين المنفذ
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# تشغيل التطبيق
CMD ["node", "server.js"]