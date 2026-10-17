import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const stagingEnvPath = path.resolve(process.cwd(), '.env.staging');

if (!fs.existsSync(stagingEnvPath)) {
  console.error('❌ .env.staging file not found in project root!');
  process.exit(1);
}

const content = fs.readFileSync(stagingEnvPath, 'utf8');
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
  console.error('❌ DATABASE_URL or DIRECT_URL is missing in .env.staging!');
  process.exit(1);
}

if (databaseUrl.includes('[YOUR-PASSWORD]') || directUrl.includes('[YOUR-PASSWORD]')) {
  console.error('⚠️ Please replace [YOUR-PASSWORD] with your actual Supabase database password in .env.staging before running this script.');
  process.exit(1);
}

console.log('🚀 Syncing Prisma Schema to Staging Database (Supabase)...');

const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DIRECT_URL: directUrl,
};

try {
  console.log('\n📦 Step 1: Pushing database schema (tables, models, indexes)...');
  execSync('npx prisma db push', { env, stdio: 'inherit' });

  console.log('\n🌱 Step 2: Seeding curriculum modules and initial data...');
  execSync('npx tsx prisma/seed.ts', { env, stdio: 'inherit' });

  console.log('\n✅ Staging database is fully initialized and seeded successfully!');
} catch (error) {
  console.error('\n❌ Failed to sync staging database:', error);
  process.exit(1);
}
