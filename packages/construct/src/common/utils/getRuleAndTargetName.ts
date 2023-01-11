export const getRuleAndTargetName = (
  trailId: string,
): { ruleName: string; targetName: string } => {
  // rule and target must not have "="
  const normalizedTrailId = trailId.replace(/=/, '');

  const ruleName = `test-rule-${normalizedTrailId}`;
  const targetName = `test-target-${normalizedTrailId}`;

  return { ruleName, targetName };
};
