export const getRuleAndTargetName = (
  trailId: string,
): { ruleName: string; targetName: string } => {
  // rule and target must not have "="
  const normalizedTrailId = trailId.replace(/=/, '');

  const ruleName = `event-scout-rule-${normalizedTrailId}`;
  const targetName = `event-scout-target-${normalizedTrailId}`;

  return { ruleName, targetName };
};
