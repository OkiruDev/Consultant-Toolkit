import { ProcurementData, Supplier } from '../types';

export function calculateProcurementScore(data: ProcurementData) {
  const { tmps, suppliers } = data;

  const TARGET = tmps * 0.8; // 80% of TMPS target for generic

  const MAX_POINTS = {
    base: 25,
    bonus: 2,
    total: 27
  };

  const RECOGNITION_TABLE: Record<number, number> = {
    1: 1.35, 2: 1.25, 3: 1.10, 4: 1.00,
    5: 0.80, 6: 0.60, 7: 0.50, 8: 0.10, 0: 0
  };

  let recognisedSpend = 0;
  let bonusPoints = 0;

  suppliers.forEach(sup => {
    const recognition = RECOGNITION_TABLE[sup.beeLevel] || 0;
    recognisedSpend += sup.spend * recognition;

    // Bonus for 51% black-owned
    if (sup.blackOwnership >= 0.51) {
      bonusPoints += (sup.spend / Math.max(tmps, 1)) * 2; // Simplified bonus calc
    }
  });

  const baseScore = TARGET > 0 
    ? Math.min(MAX_POINTS.base, (recognisedSpend / TARGET) * MAX_POINTS.base)
    : 0;

  const totalBonus = Math.min(MAX_POINTS.bonus, bonusPoints);
  
  const totalScore = baseScore + totalBonus;

  // Sub-minimum: 40% of 25 points = 10 points
  const subMinimumMet = baseScore >= 10;

  return {
    base: baseScore,
    bonus: totalBonus,
    total: Math.min(totalScore, MAX_POINTS.total),
    subMinimumMet,
    recognisedSpend,
    target: TARGET,
    rawStats: {
      spendAllBlackOwned: suppliers.filter(s => s.blackOwnership >= 0.51).reduce((acc, s) => acc + s.spend, 0),
      spendBlackWomenOwned: suppliers.filter(s => s.blackOwnership >= 0.30).reduce((acc, s) => acc + s.spend, 0), // Assuming 30% for BWO target proxy
      spendQSE: suppliers.filter(s => s.beeLevel >= 1 && s.beeLevel <= 4).reduce((acc, s) => acc + s.spend, 0), // Mocked logic
      spendEME: suppliers.filter(s => s.beeLevel >= 1 && s.beeLevel <= 4).reduce((acc, s) => acc + s.spend, 0) // Mocked logic
    }
  };
}