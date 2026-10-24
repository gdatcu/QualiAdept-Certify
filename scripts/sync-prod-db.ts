import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const prodEnvPath = path.resolve(process.cwd(), '.env');

if (!fs.existsSync(prodEnvPath)) {
  console.error('❌ .env file not found in project root!');
  process.exit(1);
}

const content = fs.readFileSync(prodEnvPath, 'utf8');
const envVars: Record<string, string> = {};

content.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }
});

const databaseUrl = envVars['DATABASE_URL'];
const directUrl = envVars['DIRECT_URL'];

if (!databaseUrl || !directUrl) {
  console.error('❌ DATABASE_URL or DIRECT_URL is missing in .env!');
  process.exit(1);
}

console.log('🚀 Syncing Prisma Schema & Validation Rules to Production Database (Supabase Prod)...');

const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DIRECT_URL: directUrl,
};

try {
  console.log('\n📦 Step 1: Verifying database schema with production...');
  execSync('npx prisma db push', { env, stdio: 'inherit' });

  console.log('\n🌱 Step 2: Seeding & updating curriculum modules (Module 5 async rules)...');
  execSync('npx tsx prisma/seed.ts', { env, stdio: 'inherit' });

  console.log('\n✅ Production database synchronized and updated successfully!');
} catch (error) {
  console.error('\n❌ Failed to sync production database:', error);
  process.exit(1);
}
