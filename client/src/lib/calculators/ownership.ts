import { OwnershipData, Shareholder } from '../types';

export function calculateOwnershipScore(data: OwnershipData) {
  const { shareholders, companyValue, outstandingDebt, yearsHeld } = data;
  
  // Constants based on Generic Codes
  const TARGET_ECONOMIC_INTEREST = 0.25; // 25%
  const MAX_POINTS = {
    votingRights: 4,
    womenBonus: 2,
    economicInterest: 8,
    netValue: 8,
    total: 25
  };

  const GRADUATION_TABLE: Record<number, number> = {
    1: 0.1, 2: 0.2, 3: 0.4, 4: 0.6,
    5: 0.8, 6: 1.0, 7: 1.0, 8: 1.0,
    9: 1.0, 10: 1.0
  };

  // Helper: Get graduation factor
  const getGraduationFactor = (years: number) => {
    if (years <= 0) return 0;
    const yearKeys = Object.keys(GRADUATION_TABLE).map(Number).sort((a,b) => a-b);
    let factor = 0;
    for (const y of yearKeys) {
      if (y <= years) factor = GRADUATION_TABLE[y];
      else break;
    }
    return factor;
  };

  // 1. Voting Rights
  const totalShares = shareholders.reduce((acc, sh) => acc + sh.shares, 0) || 1; // Prevent division by zero
  let totalBlackVoting = 0;
  let totalBlackWomenVoting = 0;
  let totalEconomicInterest = 0;
  
  let netValuePointsAgg = 0;

  shareholders.forEach(sh => {
    const ownershipPercentage = sh.shares / totalShares;
    
    // Assuming voting rights = economic interest for this simple model
    totalBlackVoting += ownershipPercentage * sh.blackOwnership;
    totalBlackWomenVoting += ownershipPercentage * sh.blackWomenOwnership;
    totalEconomicInterest += ownershipPercentage * sh.blackOwnership;

    // Net Value calculation per shareholder
    const debtAttributable = outstandingDebt * ownershipPercentage;
    const carryingValue = sh.shareValue * ownershipPercentage; // simplified
    const shareValueAllocated = companyValue * ownershipPercentage;
    
    if (carryingValue > 0 && sh.blackOwnership > 0) {
       const deemedValue = (shareValueAllocated - debtAttributable) / carryingValue;
       netValuePointsAgg += Math.max(0, deemedValue) * sh.blackOwnership;
    }
  });

  const votingRightsPoints = Math.min(totalBlackVoting * 4, MAX_POINTS.votingRights);
  const womenBonusPoints = Math.min(totalBlackWomenVoting * 2, MAX_POINTS.womenBonus);

  // 2. Economic Interest (Formula A vs B)
  const gradFactor = getGraduationFactor(yearsHeld);
  let formulaA = 0;
  if (gradFactor > 0) {
    formulaA = totalEconomicInterest * (1 / (TARGET_ECONOMIC_INTEREST * gradFactor)) * 8;
  }
  const formulaB = (totalEconomicInterest / TARGET_ECONOMIC_INTEREST) * 8;
  const economicInterestPoints = Math.min(Math.max(formulaA, formulaB), MAX_POINTS.economicInterest);

  // 3. Net Value
  const netValuePoints = Math.min(netValuePointsAgg, MAX_POINTS.netValue);

  // 4. Sub-minimum Check (40% of 8 points for Net Value = 3.2)
  const subMinimumMet = netValuePoints >= 3.2;

  const totalPoints = votingRightsPoints + womenBonusPoints + economicInterestPoints + netValuePoints;

  return {
    votingRights: votingRightsPoints,
    womenBonus: womenBonusPoints,
    economicInterest: economicInterestPoints,
    netValue: netValuePoints,
    total: Math.min(totalPoints, MAX_POINTS.total),
    subMinimumMet,
    rawStats: {
      blackVotingPercentage: totalBlackVoting,
      blackWomenVotingPercentage: totalBlackWomenVoting,
      economicInterestPercentage: totalEconomicInterest,
      netValuePercentage: netValuePointsAgg / MAX_POINTS.netValue // rough proxy
    }
  };
}