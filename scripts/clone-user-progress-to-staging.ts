import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load staging connection string
const stagingEnvPath = path.resolve(process.cwd(), '.env.staging');
if (!fs.existsSync(stagingEnvPath)) {
  console.error('❌ .env.staging not found!');
  process.exit(1);
}

const stagingEnvContent = fs.readFileSync(stagingEnvPath, 'utf8');
const stagingEnv: Record<string, string> = {};
stagingEnvContent.split('\n').forEach((l) => {
  const trimmed = l.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    stagingEnv[key] = val;
  }
});

let stagingDbUrl = stagingEnv['DATABASE_URL'];
if (stagingDbUrl && !stagingDbUrl.includes('pgbouncer=true')) {
  stagingDbUrl += (stagingDbUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
}

const prodPrisma = new PrismaClient(); // Uses default .env (production)
const stagingPrisma = new PrismaClient({
  datasources: {
    db: {
      url: stagingDbUrl,
    },
  },
});

async function main() {
  const targetEmail = process.argv[2] || 'datcugeorgecristian@gmail.com';
  console.log(`\n🔄 Cloning progress for: ${targetEmail}`);

  // 1. Fetch user, accounts & submissions from Production
  const prodUser = await prodPrisma.user.findFirst({
    where: { email: targetEmail },
    include: {
      accounts: true,
      submissions: {
        include: { assignment: true },
        orderBy: { submittedAt: 'asc' },
      },
    },
  });

  if (!prodUser) {
    console.error(`❌ User ${targetEmail} not found in Production database!`);
    process.exit(1);
  }

  console.log(`[Prod] Found user "${prodUser.name}" with ${prodUser.submissions.length} submissions and ${prodUser.accounts.length} accounts.`);

  // 2. Upsert user in Staging
  const stagingUser = await stagingPrisma.user.upsert({
    where: { email: targetEmail },
    update: {
      name: prodUser.name,
      role: prodUser.role,
      isEnrolled: prodUser.isEnrolled,
      isAdmin: prodUser.isAdmin,
      image: prodUser.image,
    },
    create: {
      id: prodUser.id,
      email: prodUser.email,
      name: prodUser.name,
      role: prodUser.role,
      isEnrolled: prodUser.isEnrolled,
      isAdmin: prodUser.isAdmin,
      image: prodUser.image,
    },
  });

  console.log(`[Staging] Target user "${stagingUser.name}" ready (ID: ${stagingUser.id}).`);

  // 2.5 Copy and link OAuth accounts so user can log in without ?error=Callback
  for (const acc of prodUser.accounts) {
    await stagingPrisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: acc.provider,
          providerAccountId: acc.providerAccountId,
        },
      },
      update: {
        userId: stagingUser.id,
        access_token: acc.access_token,
        refresh_token: acc.refresh_token,
        expires_at: acc.expires_at,
      },
      create: {
        userId: stagingUser.id,
        type: acc.type,
        provider: acc.provider,
        providerAccountId: acc.providerAccountId,
        refresh_token: acc.refresh_token,
        access_token: acc.access_token,
        expires_at: acc.expires_at,
        token_type: acc.token_type,
        scope: acc.scope,
        id_token: acc.id_token,
        session_state: acc.session_state,
      },
    });
    console.log(`[Staging] Linked OAuth account: ${acc.provider}:${acc.providerAccountId}`);
  }

  // 3. Fetch all assignments in Staging to map by module number
  const stagingAssignments = await stagingPrisma.assignment.findMany();
  const stagingAssignmentByModule = new Map(stagingAssignments.map((a) => [a.module, a]));

  console.log(`[Staging] Loaded ${stagingAssignments.length} curriculum assignments for mapping.`);

  // 4. Copy each submission over
  let copiedCount = 0;
  for (const sub of prodUser.submissions) {
    const moduleNumber = sub.assignment?.module;
    if (moduleNumber === undefined) {
      console.warn(`⚠️ Skipping submission ${sub.id}: No module number found.`);
      continue;
    }

    const stagingAssignment = stagingAssignmentByModule.get(moduleNumber);
    if (!stagingAssignment) {
      console.warn(`⚠️ Skipping module ${moduleNumber}: Not found in Staging assignments.`);
      continue;
    }

    // Upsert into staging
    await stagingPrisma.submission.create({
      data: {
        userId: stagingUser.id,
        assignmentId: stagingAssignment.id,
        codePayload: sub.codePayload,
        status: sub.status,
        score: sub.score,
        feedbackJSON: sub.feedbackJSON,
        submittedAt: sub.submittedAt,
      },
    });

    console.log(`   [✓] Copied Module ${moduleNumber}: "${stagingAssignment.title}" - Status: ${sub.status} (${sub.score}%)`);
    copiedCount++;
  }

  console.log(`\n✨ Successfully cloned ${copiedCount} submissions from Production to Staging!`);
}

main()
  .catch((e) => {
    console.error('❌ Error during clone:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prodPrisma.$disconnect();
    await stagingPrisma.$disconnect();
  });
