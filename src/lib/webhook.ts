/**
 * Send non-blocking Discord triumph webhook notification using Discord Embeds (Rich Visual Cards)
 * when a student achieves 100% PASS on a module.
 */
export async function sendDiscordTriumphNotification({
  studentName,
  userId,
  moduleNum,
  assignmentTitle,
  validationType,
}: {
  studentName: string;
  userId?: string;
  moduleNum: number;
  assignmentTitle?: string;
  validationType?: string;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.trim()) {
    return;
  }

  try {
    const isDynamic = validationType === 'DYNAMIC';
    const validationLabel = isDynamic ? 'E2E' : 'HTML/DOM';
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      'https://qualiadept.eu';

    const portfolioUrl = userId ? `${baseUrl}/portfolio/${userId}` : baseUrl;

    const payload = {
      embeds: [
        {
          title: `🎉 Modulul ${moduleNum} Deblocat!`,
          description: `**${studentName}** a trecut cu succes testele ${validationLabel} și și-a validat codul${
            assignmentTitle ? ` pentru "${assignmentTitle}"` : ''
          }.`,
          color: 3066993, // Hex #2ecc71 (Success Green)
          url: portfolioUrl,
          footer: { text: 'QualiAdept Certify Engine' },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'QualiAdeptCertify/1.0 (https://certify.qualiadept.eu)',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Fail silently so primary submission evaluation is never blocked
    console.error('Non-blocking Discord Webhook error:', error);
  }
}
