import { prisma } from '../src/lib/prisma';

async function grantAdmin() {
  const target = process.argv[2];

  if (!target) {
    console.log('\n❌ Usage: npx tsx scripts/grant-admin.ts <user_email_or_id>\n');
    console.log('Or inspect/update directly via Prisma Studio:');
    console.log('👉 npx prisma studio\n');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: target }, { id: target }],
      },
    });

    if (!user) {
      console.error(`\n❌ User not found with email or ID matching: "${target}"`);
      process.exit(1);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isAdmin: true,
        isEnrolled: true,
        role: 'TRAINER',
      },
    });

    console.log('\n✅ Admin privileges successfully granted!');
    console.log('-------------------------------------------');
    console.log(`User ID:    ${updatedUser.id}`);
    console.log(`Name:       ${updatedUser.name}`);
    console.log(`Email:      ${updatedUser.email}`);
    console.log(`Role:       ${updatedUser.role}`);
    console.log(`isAdmin:    ${updatedUser.isAdmin}`);
    console.log(`isEnrolled: ${updatedUser.isEnrolled}`);
    console.log('-------------------------------------------\n');
  } catch (error) {
    console.error('\n❌ Error updating user admin privileges:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

grantAdmin();
