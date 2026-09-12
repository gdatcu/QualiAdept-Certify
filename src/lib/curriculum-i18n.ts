/**
 * Helper to localize assignment title and description using next-intl translations
 * Falls back to database values if custom assignment or translation key is missing.
 */
export function getLocalizedAssignment<T extends { module: number; title: string; description: string }>(
  assignment: T,
  tAssignments?: (key: string) => string
): T {
  if (!tAssignments) return assignment;

  const titleKey = `m${assignment.module}_title`;
  const descKey = `m${assignment.module}_description`;

  try {
    const localizedTitle = tAssignments(titleKey);
    const localizedDesc = tAssignments(descKey);

    return {
      ...assignment,
      title: localizedTitle && !localizedTitle.startsWith('m') ? localizedTitle : assignment.title,
      description: localizedDesc && !localizedDesc.startsWith('m') ? localizedDesc : assignment.description,
    };
  } catch {
    return assignment;
  }
}
