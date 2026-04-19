import { ESDData, SEDData } from '../types';

export function calculateEsdScore(data: ESDData, npat: number) {
  const { contributions } = data;

  const TARGET_SUPPLIER_DEV = npat * 0.02; // 2%
  const TARGET_ENTERPRISE_DEV = npat * 0.01; // 1%

  const MAX_POINTS = {
    supplierDev: 10,
    enterpriseDev: 5,
    total: 15
  };

  // Benefit factors (simplified)
  const getBenefitFactor = (type: string) => {
    switch(type) {
      case 'grant': return 1.0;
      case 'interest_free_loan': return 0.7;
      case 'professional_services': return 0.8;
      default: return 1.0;
    }
  };

  let sdSpend = 0;
  let edSpend = 0;

  contributions.forEach(c => {
    const recognisedAmount = c.amount * getBenefitFactor(c.type);
    if (c.category === 'supplier_development') {
      sdSpend += recognisedAmount;
    } else if (c.category === 'enterprise_development') {
      edSpend += recognisedAmount;
    }
  });

  const sdScore = TARGET_SUPPLIER_DEV > 0
    ? Math.min(MAX_POINTS.supplierDev, (sdSpend / TARGET_SUPPLIER_DEV) * MAX_POINTS.supplierDev)
    : 0;

  const edScore = TARGET_ENTERPRISE_DEV > 0
    ? Math.min(MAX_POINTS.enterpriseDev, (edSpend / TARGET_ENTERPRISE_DEV) * MAX_POINTS.enterpriseDev)
    : 0;

  const totalScore = sdScore + edScore;

  return {
    supplierDev: sdScore,
    enterpriseDev: edScore,
    total: Math.min(totalScore, MAX_POINTS.total),
    subMinimumMet: true, // Typically no sub-min for ESD
    sdSpend,
    edSpend,
    sdTarget: TARGET_SUPPLIER_DEV,
    edTarget: TARGET_ENTERPRISE_DEV
  };
}

export function calculateSedScore(data: SEDData, npat: number) {
  const { contributions } = data;

  const TARGET = npat * 0.01; // 1%

  const MAX_POINTS = {
    total: 5
  };

  let totalSpend = contributions.reduce((acc, c) => acc + c.amount, 0);

  const score = TARGET > 0
    ? Math.min(MAX_POINTS.total, (totalSpend / TARGET) * MAX_POINTS.total)
    : 0;

  return {
    total: score,
    subMinimumMet: true, // No sub-min for SED
    actualSpend: totalSpend,
    target: TARGET,
    rawStats: {
      spendSED: totalSpend
    }
  };
}