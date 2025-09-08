/**
 * API endpoint لإنشاء واستعادة النسخ الاحتياطية
 * Database Backup API Endpoint
 */

import { NextResponse } from 'next/server';
import dbManager from '../../../../lib/database-manager';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
    try {
        const { action, mode = 'local', backupData } = await request.json();

        if (!action || !['create', 'restore'].includes(action)) {
            return NextResponse.json({
                success: false,
                error: 'يجب تحديد الإجراء: create أو restore'
            }, { status: 400 });
        }

        if (action === 'create') {
            // إنشاء نسخة احتياطية
            const backup = await dbManager.createBackup(mode);
            
            // حفظ النسخة الاحتياطية في ملف
            const backupDir = path.join(process.cwd(), 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            const backupFile = path.join(backupDir, `backup_${mode}_${Date.now()}.json`);
            fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

            return NextResponse.json({
                success: true,
                message: `تم إنشاء النسخة الاحتياطية من ${mode}`,
                data: {
                    backupFile,
                    timestamp: backup.timestamp,
                    mode: backup.mode
                }
            });

        } else if (action === 'restore') {
            // استعادة نسخة احتياطية
            if (!backupData) {
                return NextResponse.json({
                    success: false,
                    error: 'يجب توفير بيانات النسخة الاحتياطية'
                }, { status: 400 });
            }

            const result = await dbManager.restoreBackup(backupData, mode);

            return NextResponse.json({
                success: true,
                message: `تم استعادة النسخة الاحتياطية إلى ${mode}`,
                data: result
            });
        }

    } catch (error) {
        console.error('خطأ في إدارة النسخ الاحتياطية:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        // الحصول على قائمة النسخ الاحتياطية
        const backupDir = path.join(process.cwd(), 'backups');
        
        if (!fs.existsSync(backupDir)) {
            return NextResponse.json({
                success: true,
                data: {
                    backups: []
                }
            });
        }

        const backupFiles = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            })
            .sort((a, b) => b.created - a.created);

        return NextResponse.json({
            success: true,
            data: {
                backups: backupFiles
            }
        });

    } catch (error) {
        console.error('خطأ في الحصول على قائمة النسخ الاحتياطية:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}