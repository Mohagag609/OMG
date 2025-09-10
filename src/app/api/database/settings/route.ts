import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { Client } from 'pg';
import sqlite3 from 'sqlite3';

// Helper function to execute shell commands
function runCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        // Don't reject on stderr, as some commands use it for progress
        console.warn(`Command stderr: ${stderr}`);
      }
      resolve({ stdout, stderr });
    });
  });
}

// GET handler to fetch current database settings
export async function GET() {
  try {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const schemaContent = await fs.readFile(schemaPath, 'utf-8');

    const providerMatch = schemaContent.match(/provider\s*=\s*"([^"]+)"/);
    const provider = providerMatch ? providerMatch[1] : 'unknown';

    // Read from .env file directly to get the stored value
    const envPath = path.join(process.cwd(), '.env');
    let databaseUrl = '';
    try {
        const envContent = await fs.readFile(envPath, 'utf-8');
        const dbUrlMatch = envContent.match(/^DATABASE_URL="?([^"]*)"?/m);
        if (dbUrlMatch) {
            databaseUrl = dbUrlMatch[1];
        }
    } catch(e) {
        console.warn("Could not read .env file, relying on process.env")
        databaseUrl = process.env.DATABASE_URL || '';
    }

    return NextResponse.json({ provider, databaseUrl });
  } catch (error: any) {
    console.error('Failed to get database settings:', error);
    return NextResponse.json({ message: 'Error fetching settings', error: error.message }, { status: 500 });
  }
}

// POST handler to test or save database settings
export async function POST(request: Request) {
  try {
    const { action, ...settings } = await request.json();

    if (action === 'test') {
      return await testDatabaseConnection(settings);
    }

    if (action === 'save') {
      return await saveDatabaseSettings(settings);
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to process request:', error);
    return NextResponse.json({ message: 'Error processing request', error: error.message }, { status: 500 });
  }
}

async function testDatabaseConnection(settings: any): Promise<NextResponse> {
  const { provider, databaseUrl } = settings;

  if (!provider || !databaseUrl) {
    return NextResponse.json({ message: 'Provider and URL are required' }, { status: 400 });
  }

  if (provider === 'postgresql') {
    const client = new Client({ connectionString: databaseUrl });
    try {
      await client.connect();
      await client.end();
      return NextResponse.json({ message: 'Connection successful' });
    } catch (error: any) {
      console.error('PostgreSQL connection test failed:', error);
      return NextResponse.json({ message: 'Connection failed', error: error.message }, { status: 400 });
    }
  }

  if (provider === 'sqlite') {
    // For SQLite, the URL is a file path starting with "file:"
    const filePath = databaseUrl.replace(/^file:/, '');
    const db = new sqlite3.Database(filePath, (err) => {
        // This callback is for connection errors.
        // We will handle this in the promise below.
    });

    return new Promise((resolve) => {
        db.on('open', () => {
            db.close((closeErr) => {
                if(closeErr) {
                    console.error('SQLite close error:', closeErr);
                }
                resolve(NextResponse.json({ message: 'Connection successful' }));
            });
        });

        db.on('error', (err) => {
            console.error('SQLite connection test failed:', err);
            resolve(NextResponse.json({ message: 'Connection failed', error: err.message }, { status: 400 }));
        });
    });
  }

  return NextResponse.json({ message: 'Unsupported provider for testing' }, { status: 400 });
}

async function saveDatabaseSettings(settings: any) {
  const { provider, databaseUrl } = settings;

  if (!provider || !databaseUrl) {
    return NextResponse.json({ message: 'Provider and URL are required' }, { status: 400 });
  }

  try {
    // 1. Update .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch (e) {
      // .env might not exist, which is fine
      console.log('.env file not found, creating a new one.');
    }

    const dbUrlRegex = /^DATABASE_URL=.*/m;
    if (dbUrlRegex.test(envContent)) {
      envContent = envContent.replace(dbUrlRegex, `DATABASE_URL="${databaseUrl}"`);
    } else {
      envContent += `\nDATABASE_URL="${databaseUrl}"`;
    }
    await fs.writeFile(envPath, envContent.trim());

    // 2. Update prisma/schema.prisma
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    let schemaContent = await fs.readFile(schemaPath, 'utf-8');
    const providerRegex = /provider\s*=\s*"([^"]+)"/;
    schemaContent = schemaContent.replace(providerRegex, `provider = "${provider}"`);
    await fs.writeFile(schemaPath, schemaContent);

    // 3. Run 'prisma generate'
    console.log("Running 'prisma generate'...");
    // We need to set the DATABASE_URL for the command to succeed
    const command = `DATABASE_URL="${databaseUrl}" npx prisma generate`;
    const { stdout, stderr } = await runCommand(command);
    console.log('Prisma generate stdout:', stdout);
    if (stderr) {
        console.warn('Prisma generate stderr:', stderr);
    }
    console.log('Prisma generate completed.');

    // 4. We need to run db push to sync the schema with the new database
    console.log("Running 'prisma db push'...");
    const pushCommand = `DATABASE_URL="${databaseUrl}" npx prisma db push --accept-data-loss`;
    const { stdout: pushStdout, stderr: pushStderr } = await runCommand(pushCommand);
    console.log('Prisma db push stdout:', pushStdout);
    if (pushStderr) {
        console.warn('Prisma db push stderr:', pushStderr);
    }
    console.log('Prisma db push completed.');


    return NextResponse.json({ message: 'Settings saved successfully. Please restart the server to apply changes.' });

  } catch (error: any) {
    console.error('Failed to save database settings:', error);
    return NextResponse.json({ message: 'Failed to save settings', error: error.message }, { status: 500 });
  }
}
