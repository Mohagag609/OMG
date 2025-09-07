#!/bin/bash

# Production startup script for Estate Management System

echo "Starting Estate Management System in Production Mode..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Check if database exists, if not create it
if [ ! -f "dev.db" ]; then
    echo "Creating database..."
    npx prisma db push
fi

# Set production environment
export NODE_ENV=production

# Start the application
echo "Starting application..."
npm start