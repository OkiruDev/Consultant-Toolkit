import * as XLSX from 'xlsx';
import { BbeeState } from './store'; // Assuming you can infer the type, or we just use 'any'

export const exportToExcel = (state: any) => {
  const wb = XLSX.utils.book_new();

  // 1. Scorecard Summary
  const summaryData = [
    { Element: "Ownership", Score: state.scorecard.ownership.score.toFixed(2), Target: state.scorecard.ownership.target, SubMinimumMet: state.scorecard.ownership.subMinimumMet ? "Yes" : "No" },
    { Element: "Management Control", Score: state.scorecard.managementControl.score.toFixed(2), Target: state.scorecard.managementControl.target, SubMinimumMet: "N/A" },
    { Element: "Skills Development", Score: state.scorecard.skillsDevelopment.score.toFixed(2), Target: state.scorecard.skillsDevelopment.target, SubMinimumMet: state.scorecard.skillsDevelopment.subMinimumMet ? "Yes" : "No" },
    { Element: "Preferential Procurement", Score: state.scorecard.procurement.score.toFixed(2), Target: state.scorecard.procurement.target, SubMinimumMet: state.scorecard.procurement.subMinimumMet ? "Yes" : "No" },
    { Element: "Enterprise Development", Score: state.scorecard.enterpriseDevelopment.score.toFixed(2), Target: state.scorecard.enterpriseDevelopment.target, SubMinimumMet: "N/A" },
    { Element: "Socio-Economic Dev", Score: state.scorecard.socioEconomicDevelopment.score.toFixed(2), Target: state.scorecard.socioEconomicDevelopment.target, SubMinimumMet: "N/A" },
    { Element: "TOTAL", Score: state.scorecard.total.score.toFixed(2), Target: state.scorecard.total.target, SubMinimumMet: state.scorecard.isDiscounted ? "FAILED (Discounted)" : "PASSED" }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  
  // Make column headers bold
  const wscols = [
    {wch: 35}, // Element
    {wch: 15}, // Score
    {wch: 15}, // Target
    {wch: 20}  // SubMinimumMet
  ];
  wsSummary['!cols'] = wscols;
  XLSX.utils.book_append_sheet(wb, wsSummary, "Scorecard Summary");

  // 2. Client & Financials
  const financialsData = [
    { Metric: "Client Name", Value: state.client.name },
    { Metric: "Financial Year", Value: state.client.financialYear },
    { Metric: "Industry Sector", Value: state.client.industrySector },
    { Metric: "Revenue (ZAR)", Value: state.client.revenue },
    { Metric: "NPAT (ZAR)", Value: state.client.npat },
    { Metric: "Leviable Amount (ZAR)", Value: state.client.leviableAmount },
    { Metric: "TMPS (ZAR)", Value: state.procurement.tmps }
  ];
  const wsFinancials = XLSX.utils.json_to_sheet(financialsData);
  wsFinancials['!cols'] = [{wch: 25}, {wch: 30}];
  XLSX.utils.book_append_sheet(wb, wsFinancials, "Company Profile");

  // 3. Shareholders (Ownership)
  const ownershipData = state.ownership.shareholders.map((sh: any) => ({
    Shareholder: sh.name,
    "Black Ownership %": (sh.blackOwnership * 100).toFixed(2) + "%",
    "Black Women %": (sh.blackWomenOwnership * 100).toFixed(2) + "%",
    "Shares Held": sh.shares,
    "Share Value (ZAR)": sh.shareValue
  }));
  if (ownershipData.length > 0) {
    const wsOwnership = XLSX.utils.json_to_sheet(ownershipData);
    XLSX.utils.book_append_sheet(wb, wsOwnership, "Ownership");
  }

  // 4. Procurement (Suppliers)
  const procurementData = state.procurement.suppliers.map((sup: any) => ({
    Supplier: sup.name,
    "B-BBEE Level": sup.beeLevel === 0 ? "Non-Compliant" : `Level ${sup.beeLevel}`,
    "Black Ownership %": (sup.blackOwnership * 100).toFixed(2) + "%",
    "Spend (ZAR)": sup.spend
  }));
  if (procurementData.length > 0) {
    const wsProcurement = XLSX.utils.json_to_sheet(procurementData);
    XLSX.utils.book_append_sheet(wb, wsProcurement, "Procurement");
  }

  // Generate Excel file
  const fileName = `${state.client.name.replace(/\s+/g, '_')}_BBBEE_Export.xlsx`;
  XLSX.writeFile(wb, fileName);
};