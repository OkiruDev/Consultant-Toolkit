import { SkillsData } from '../types';

export function calculateSkillsScore(data: SkillsData) {
  const { leviableAmount, trainingPrograms } = data;
  
  const TARGET_OVERALL = leviableAmount * 0.035; // 3.5%
  const TARGET_BURSARIES = leviableAmount * 0.025; // 2.5%

  const MAX_POINTS = {
    general: 20,
    bursaries: 5, // Split out from general for simplification
    total: 25
  };

  let totalSpend = 0;
  let bursarySpend = 0;

  trainingPrograms.forEach(prog => {
    // Only count spend on black individuals
    if (prog.isBlack) {
      totalSpend += prog.cost;
      if (prog.category === 'bursary') {
        bursarySpend += prog.cost;
      }
    }
  });

  const generalScore = TARGET_OVERALL > 0 
    ? Math.min(MAX_POINTS.general, (totalSpend / TARGET_OVERALL) * MAX_POINTS.general)
    : 0;

  const bursaryScore = TARGET_BURSARIES > 0
    ? Math.min(MAX_POINTS.bursaries, (bursarySpend / TARGET_BURSARIES) * MAX_POINTS.bursaries)
    : 0;

  const totalScore = generalScore + bursaryScore;
  
  // Sub-minimum: 40% of 20 points = 8 points
  const subMinimumMet = generalScore >= 8;

  return {
    general: generalScore,
    bursaries: bursaryScore,
    total: Math.min(totalScore, MAX_POINTS.total),
    subMinimumMet,
    targetOverall: TARGET_OVERALL,
    targetBursaries: TARGET_BURSARIES,
    actualSpend: totalSpend,
    actualBursarySpend: bursarySpend,
    rawStats: {
      blackSpend: totalSpend,
      blackWomenSpend: totalSpend * 0.5, // Mocked for simplicity
      disabledSpend: totalSpend * 0.05, // Mocked for simplicity
      absorbedCount: 0 // Mocked
    }
  };
}