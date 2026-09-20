import { prisma } from '../src/lib/prisma';

async function deleteUser() {
  const target = process.argv[2] || 'marianciobanu0612';

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: target },
          { name: target },
          { email: target },
        ],
      },
    });

    if (!user) {
      console.log(`❌ User not found with identifier "${target}"`);
      process.exit(1);
    }

    console.log(`Deleting user: ${user.name} (${user.email}) - ID: ${user.id}...`);

    // 1. Delete associated submissions if any
    const deletedSubmissions = await prisma.submission.deleteMany({
      where: { userId: user.id },
    });

    // 2. Delete associated sessions if any
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // 3. Delete associated accounts
    const deletedAccounts = await prisma.account.deleteMany({
      where: { userId: user.id },
    });

    // 4. Delete user
    const deletedUser = await prisma.user.delete({
      where: { id: user.id },
    });

    console.log(`✅ Successfully deleted user ${deletedUser.name} (${deletedUser.email})!`);
    console.log(`   - Deleted accounts: ${deletedAccounts.count}`);
    console.log(`   - Deleted sessions: ${deletedSessions.count}`);
    console.log(`   - Deleted submissions: ${deletedSubmissions.count}`);
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
