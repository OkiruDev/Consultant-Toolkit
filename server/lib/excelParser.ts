/**
 * Production-grade Excel parsing pipeline for B-BBEE data extraction.
 * Uses BM25-style matching, NER entity extraction, and intelligent sheet/column detection.
 */

import * as XLSX from 'xlsx';
import { matchSheetName, matchHeaders, type FieldMatch } from './textSimilarity';
import { extractEntity, extractCurrency, extractPercentage } from './entityExtractor';

export interface ParseLog {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

export interface ParsedClient {
  name?: string;
  financialYear?: string;
  revenue?: number;
  npat?: number;
  leviableAmount?: number;
  industrySector?: string;
}

export interface ParsedShareholder {
  name: string;
  blackOwnership: number;
  blackWomenOwnership: number;
  shares?: number;
  shareValue?: number;
}

export interface ParsedEmployee {
  name: string;
  gender: string;
  race: string;
  designation: string;
  isDisabled: boolean;
}

export interface ParsedSupplier {
  name: string;
  beeLevel: number;
  blackOwnership: number;
  spend: number;
}

export interface ParsedContribution {
  beneficiary: string;
  type: string;
  amount: number;
  category: string;
}

export interface ParseResult {
  success: boolean;
  client: ParsedClient;
  shareholders: ParsedShareholder[];
  employees: ParsedEmployee[];
  suppliers: ParsedSupplier[];
  esdContributions: ParsedContribution[];
  sedContributions: ParsedContribution[];
  sheetsFound: string[];
  sheetsMatched: { sheetName: string; matchedTo: string; confidence: number }[];
  errors: string[];
  warnings: string[];
  logs: ParseLog[];
  stats: {
    totalSheets: number;
    matchedSheets: number;
    entitiesExtracted: number;
    confidence: number;
  };
}

const EXPECTED_SHEETS = [
  { key: 'client', names: ['client information', 'client info', 'client data', 'client details', 'company info', 'company information', 'entity info', 'entity information', 'cover', 'summary'] },
  { key: 'financials', names: ['financials', 'financial data', 'financial information', 'income statement', 'p&l', 'profit and loss', 'revenue', 'financial summary'] },
  { key: 'ownership', names: ['ownership', 'ownership data', 'ownership information', 'shareholder', 'shareholders', 'equity', 'share register', 'share holding'] },
  { key: 'management', names: ['management control', 'management', 'mc data', 'mc', 'management data', 'employees', 'employee data', 'staff', 'personnel', 'human resources', 'hr'] },
  { key: 'skills', names: ['skills development', 'skills', 'skills data', 'training', 'training data', 'learnerships', 'bursaries', 'sdp'] },
  { key: 'procurement', names: ['procurement', 'procurement data', 'preferential procurement', 'pp', 'suppliers', 'supplier data', 'vendor', 'vendors', 'supply chain'] },
  { key: 'esd', names: ['esd', 'esd data', 'enterprise development', 'enterprise and supplier development', 'supplier development', 'ed', 'sd'] },
  { key: 'sed', names: ['sed', 'sed data', 'socio economic development', 'socio-economic', 'social', 'csi', 'corporate social investment'] },
  { key: 'scorecard', names: ['scorecard', 'summary scorecard', 'bbbee scorecard', 'b-bbee scorecard', 'score', 'results', 'dashboard'] },
  { key: 'industry', names: ['industry norms', 'industry', 'norms', 'sector codes', 'industry codes'] },
  { key: 'eap', names: ['eap', 'economically active population', 'demographics', 'population'] },
];

const CLIENT_FIELDS = [
  { name: 'Company Name', aliases: ['entity name', 'client name', 'name', 'company', 'entity', 'organisation', 'organization', 'business name'] },
  { name: 'Financial Year', aliases: ['year', 'fy', 'fin year', 'financial year end', 'year end', 'period'] },
  { name: 'Revenue', aliases: ['total revenue', 'turnover', 'income', 'gross revenue', 'annual revenue', 'sales'] },
  { name: 'NPAT', aliases: ['net profit', 'net profit after tax', 'profit after tax', 'pat', 'net income', 'bottom line'] },
  { name: 'Leviable Amount', aliases: ['payroll', 'total payroll', 'leviable payroll', 'salary bill', 'wage bill', 'total remuneration'] },
  { name: 'Industry Sector', aliases: ['sector', 'industry', 'sector code', 'industry code', 'sic code'] },
];

const OWNERSHIP_FIELDS = [
  { name: 'Shareholder Name', aliases: ['name', 'shareholder', 'entity name', 'holder', 'investor'] },
  { name: 'Black Ownership', aliases: ['bo%', 'bo', 'black %', 'black ownership %', 'black owned', 'bo percent', 'black shareholding'] },
  { name: 'Black Women Ownership', aliases: ['bwo%', 'bwo', 'black women %', 'black women ownership %', 'bw%', 'women %', 'female black'] },
  { name: 'Shares', aliases: ['shares %', 'share %', 'shareholding', 'percentage', 'equity %', 'stake'] },
  { name: 'Share Value', aliases: ['value', 'share value', 'investment value', 'rand value', 'amount'] },
];

const MC_FIELDS = [
  { name: 'Name', aliases: ['full name', 'employee name', 'staff name', 'person', 'surname', 'first name'] },
  { name: 'Gender', aliases: ['sex', 'male/female', 'm/f', 'gender identity'] },
  { name: 'Race', aliases: ['race group', 'population group', 'ethnicity', 'demographic', 'racial group'] },
  { name: 'Designation', aliases: ['level', 'occupational level', 'position', 'role', 'job title', 'grade', 'category', 'management level'] },
  { name: 'Disabled', aliases: ['disability', 'is disabled', 'pwd', 'person with disability', 'differently abled'] },
];

const PROCUREMENT_FIELDS = [
  { name: 'Supplier Name', aliases: ['name', 'supplier', 'vendor', 'vendor name', 'company', 'entity'] },
  { name: 'B-BBEE Level', aliases: ['bee level', 'level', 'bbbee level', 'b-bbee', 'compliance level', 'bee status'] },
  { name: 'Black Ownership', aliases: ['bo%', 'bo', 'black owned', 'black ownership %', '% black'] },
  { name: 'Spend', aliases: ['amount', 'spend amount', 'total spend', 'procurement spend', 'value', 'rand value', 'cost'] },
];

const ESD_FIELDS = [
  { name: 'Beneficiary', aliases: ['name', 'beneficiary name', 'recipient', 'entity', 'company'] },
  { name: 'Type', aliases: ['contribution type', 'nature', 'form', 'method', 'support type'] },
  { name: 'Amount', aliases: ['value', 'rand value', 'spend', 'contribution amount', 'cost', 'total'] },
  { name: 'Category', aliases: ['category', 'pillar', 'ed/sd', 'classification'] },
];

function addLog(logs: ParseLog[], message: string, type: ParseLog['type'] = 'info'): void {
  logs.push({
    message,
    type,
    timestamp: new Date().toISOString(),
  });
}

function getSheetData(workbook: XLSX.WorkBook, sheetName: string): any[][] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
}

function findHeaderRow(data: any[][]): { rowIndex: number; headers: string[] } {
  // Look for the first row with 2+ non-empty string cells
  for (let i = 0; i < Math.min(data.length, 15); i++) {
    const row = data[i];
    if (!row) continue;
    const nonEmpty = row.filter((c: any) => c !== null && c !== undefined && String(c).trim() !== '');
    const strings = nonEmpty.filter((c: any) => typeof c === 'string' || (typeof c === 'number' && isNaN(c) === false));
    if (strings.length >= 2) {
      return {
        rowIndex: i,
        headers: row.map((c: any) => String(c || '').trim()),
      };
    }
  }
  return { rowIndex: 0, headers: data[0]?.map((c: any) => String(c || '').trim()) || [] };
}

function parseClientSheet(data: any[][], logs: ParseLog[]): ParsedClient {
  const client: ParsedClient = {};

  // Try key-value pair detection (Label | Value layout)
  for (const row of data) {
    if (!row || row.length < 2) continue;
    const label = String(row[0] || '').toLowerCase().trim();
    const value = row[1];

    if (!label || !value) continue;

    if (/company|client|entity|name|organisation/.test(label) && typeof value === 'string' && value.length > 1) {
      client.name = String(value).trim();
      addLog(logs, `Extracted Client Name: "${client.name}"`, 'success');
    }
    if (/revenue|turnover|income|sales/.test(label)) {
      const amt = extractCurrency(value);
      if (amt) { client.revenue = amt; addLog(logs, `Extracted Revenue: R${amt.toLocaleString()}`, 'success'); }
    }
    if (/npat|net profit|profit after tax/.test(label)) {
      const amt = extractCurrency(value);
      if (amt !== null) { client.npat = amt; addLog(logs, `Extracted NPAT: R${amt.toLocaleString()}`, 'success'); }
    }
    if (/leviable|payroll|salary|remuneration/.test(label)) {
      const amt = extractCurrency(value);
      if (amt) { client.leviableAmount = amt; addLog(logs, `Extracted Leviable Amount: R${amt.toLocaleString()}`, 'success'); }
    }
    if (/year|fy|financial year|period/.test(label)) {
      const yr = String(value).trim();
      client.financialYear = yr;
      addLog(logs, `Extracted Financial Year: ${yr}`, 'success');
    }
    if (/sector|industry|sic/.test(label)) {
      client.industrySector = String(value).trim();
      addLog(logs, `Extracted Industry Sector: ${client.industrySector}`, 'success');
    }
  }

  return client;
}

function parseOwnershipSheet(data: any[][], logs: ParseLog[]): ParsedShareholder[] {
  const { rowIndex, headers } = findHeaderRow(data);
  const matches = matchHeaders(headers, OWNERSHIP_FIELDS);

  if (matches.length < 2) {
    addLog(logs, `Ownership: Only ${matches.length} columns matched (need 2+). Skipping.`, 'warning');
    return [];
  }

  addLog(logs, `Ownership: Matched ${matches.length} columns: ${matches.map(m => `${m.field} → "${m.matchedHeader}" (${(m.confidence * 100).toFixed(0)}%)`).join(', ')}`, 'info');

  const nameCol = matches.find(m => m.field === 'Shareholder Name');
  const boCol = matches.find(m => m.field === 'Black Ownership');
  const bwoCol = matches.find(m => m.field === 'Black Women Ownership');
  const sharesCol = matches.find(m => m.field === 'Shares');
  const valueCol = matches.find(m => m.field === 'Share Value');

  const shareholders: ParsedShareholder[] = [];

  for (let i = rowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const name = nameCol ? String(row[nameCol.columnIndex] || '').trim() : '';
    if (!name || name.length < 2) continue;

    const bo = boCol ? extractPercentage(row[boCol.columnIndex]) : null;
    const bwo = bwoCol ? extractPercentage(row[bwoCol.columnIndex]) : null;
    const shares = sharesCol ? extractCurrency(row[sharesCol.columnIndex]) : null;
    const value = valueCol ? extractCurrency(row[valueCol.columnIndex]) : null;

    shareholders.push({
      name,
      blackOwnership: bo ?? 0,
      blackWomenOwnership: bwo ?? 0,
      shares: shares ?? 0,
      shareValue: value ?? 0,
    });
  }

  addLog(logs, `Ownership: Extracted ${shareholders.length} shareholders`, shareholders.length > 0 ? 'success' : 'warning');
  return shareholders;
}

function parseMCSheet(data: any[][], logs: ParseLog[]): ParsedEmployee[] {
  const { rowIndex, headers } = findHeaderRow(data);
  const matches = matchHeaders(headers, MC_FIELDS);

  if (matches.length < 2) {
    addLog(logs, `Management Control: Only ${matches.length} columns matched (need 2+). Skipping.`, 'warning');
    return [];
  }

  addLog(logs, `Management Control: Matched ${matches.length} columns`, 'info');

  const nameCol = matches.find(m => m.field === 'Name');
  const genderCol = matches.find(m => m.field === 'Gender');
  const raceCol = matches.find(m => m.field === 'Race');
  const desigCol = matches.find(m => m.field === 'Designation');
  const disCol = matches.find(m => m.field === 'Disabled');

  const employees: ParsedEmployee[] = [];

  for (let i = rowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const name = nameCol ? String(row[nameCol.columnIndex] || '').trim() : '';
    if (!name || name.length < 2) continue;

    const genderEntity = genderCol ? extractEntity(row[genderCol.columnIndex]) : null;
    const raceEntity = raceCol ? extractEntity(row[raceCol.columnIndex]) : null;
    const desigEntity = desigCol ? extractEntity(row[desigCol.columnIndex]) : null;

    employees.push({
      name,
      gender: genderEntity?.value || 'Male',
      race: raceEntity?.value || 'White',
      designation: desigEntity?.value || 'Junior',
      isDisabled: disCol ? /yes|y|true|1|disabled/i.test(String(row[disCol.columnIndex] || '')) : false,
    });
  }

  addLog(logs, `Management Control: Extracted ${employees.length} employees`, employees.length > 0 ? 'success' : 'warning');
  return employees;
}

function parseProcurementSheet(data: any[][], logs: ParseLog[]): ParsedSupplier[] {
  const { rowIndex, headers } = findHeaderRow(data);
  const matches = matchHeaders(headers, PROCUREMENT_FIELDS);

  if (matches.length < 2) {
    addLog(logs, `Procurement: Only ${matches.length} columns matched (need 2+). Skipping.`, 'warning');
    return [];
  }

  addLog(logs, `Procurement: Matched ${matches.length} columns`, 'info');

  const nameCol = matches.find(m => m.field === 'Supplier Name');
  const levelCol = matches.find(m => m.field === 'B-BBEE Level');
  const boCol = matches.find(m => m.field === 'Black Ownership');
  const spendCol = matches.find(m => m.field === 'Spend');

  const suppliers: ParsedSupplier[] = [];

  for (let i = rowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const name = nameCol ? String(row[nameCol.columnIndex] || '').trim() : '';
    if (!name || name.length < 2) continue;

    const levelEntity = levelCol ? extractEntity(row[levelCol.columnIndex]) : null;
    const bo = boCol ? extractPercentage(row[boCol.columnIndex]) : null;
    const spend = spendCol ? extractCurrency(row[spendCol.columnIndex]) : null;

    suppliers.push({
      name,
      beeLevel: levelEntity?.type === 'bee_level' ? levelEntity.value : 0,
      blackOwnership: bo ?? 0,
      spend: spend ?? 0,
    });
  }

  addLog(logs, `Procurement: Extracted ${suppliers.length} suppliers`, suppliers.length > 0 ? 'success' : 'warning');
  return suppliers;
}

function parseEsdSedSheet(data: any[][], logs: ParseLog[], category: string): ParsedContribution[] {
  const { rowIndex, headers } = findHeaderRow(data);
  const matches = matchHeaders(headers, ESD_FIELDS);

  if (matches.length < 2) {
    addLog(logs, `${category}: Only ${matches.length} columns matched. Skipping.`, 'warning');
    return [];
  }

  const nameCol = matches.find(m => m.field === 'Beneficiary');
  const typeCol = matches.find(m => m.field === 'Type');
  const amtCol = matches.find(m => m.field === 'Amount');
  const catCol = matches.find(m => m.field === 'Category');

  const contributions: ParsedContribution[] = [];

  for (let i = rowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const name = nameCol ? String(row[nameCol.columnIndex] || '').trim() : '';
    if (!name || name.length < 2) continue;

    const amount = amtCol ? extractCurrency(row[amtCol.columnIndex]) : null;

    contributions.push({
      beneficiary: name,
      type: typeCol ? String(row[typeCol.columnIndex] || 'grant').toLowerCase().replace(/\s+/g, '_') : 'grant',
      amount: amount ?? 0,
      category: catCol ? String(row[catCol.columnIndex] || category).toLowerCase().replace(/\s+/g, '_') : category,
    });
  }

  addLog(logs, `${category}: Extracted ${contributions.length} contributions`, contributions.length > 0 ? 'success' : 'warning');
  return contributions;
}

export function parseExcelBuffer(buffer: Buffer, filename: string): ParseResult {
  const logs: ParseLog[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  addLog(logs, `Starting import of "${filename}"`, 'info');

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (e: any) {
    addLog(logs, `Failed to read file: ${e.message}`, 'error');
    return {
      success: false,
      client: {},
      shareholders: [],
      employees: [],
      suppliers: [],
      esdContributions: [],
      sedContributions: [],
      sheetsFound: [],
      sheetsMatched: [],
      errors: [`Could not parse "${filename}". Is this a valid Excel file?`],
      warnings: [],
      logs,
      stats: { totalSheets: 0, matchedSheets: 0, entitiesExtracted: 0, confidence: 0 },
    };
  }

  const sheetNames = workbook.SheetNames;
  addLog(logs, `Found ${sheetNames.length} sheet(s): ${sheetNames.join(', ')}`, 'info');

  // Match sheets to expected categories
  const sheetsMatched: { sheetName: string; matchedTo: string; confidence: number }[] = [];
  const sheetMap: Record<string, string> = {};

  for (const name of sheetNames) {
    const match = matchSheetName(name, EXPECTED_SHEETS);
    if (match) {
      sheetsMatched.push({ sheetName: name, matchedTo: match.key, confidence: match.confidence });
      sheetMap[match.key] = name;
      addLog(logs, `Sheet "${name}" → matched to "${match.key}" (${(match.confidence * 100).toFixed(0)}% confidence)`, 'success');
    } else {
      addLog(logs, `Sheet "${name}" → no match found, skipping`, 'warning');
      warnings.push(`Sheet "${name}" was not recognized as B-BBEE data`);
    }
  }

  if (sheetsMatched.length === 0) {
    addLog(logs, 'No recognizable B-BBEE sheets found in this file.', 'error');
    errors.push('No recognizable B-BBEE data sheets were found. Try uploading a standard toolkit or rename your sheets to match expected names (e.g., "Ownership Data", "Management Control", "Procurement").');
    return {
      success: false,
      client: {},
      shareholders: [],
      employees: [],
      suppliers: [],
      esdContributions: [],
      sedContributions: [],
      sheetsFound: sheetNames,
      sheetsMatched,
      errors,
      warnings,
      logs,
      stats: { totalSheets: sheetNames.length, matchedSheets: 0, entitiesExtracted: 0, confidence: 0 },
    };
  }

  // Parse each matched sheet
  let client: ParsedClient = {};
  let shareholders: ParsedShareholder[] = [];
  let employees: ParsedEmployee[] = [];
  let suppliers: ParsedSupplier[] = [];
  let esdContributions: ParsedContribution[] = [];
  let sedContributions: ParsedContribution[] = [];

  if (sheetMap['client'] || sheetMap['scorecard']) {
    const sheetName = sheetMap['client'] || sheetMap['scorecard'];
    addLog(logs, `Parsing client information from "${sheetName}"...`, 'info');
    const data = getSheetData(workbook, sheetName);
    client = parseClientSheet(data, logs);
  }

  if (sheetMap['financials']) {
    addLog(logs, `Parsing financials from "${sheetMap['financials']}"...`, 'info');
    const data = getSheetData(workbook, sheetMap['financials']);
    const finClient = parseClientSheet(data, logs);
    client = { ...client, ...finClient };
  }

  if (sheetMap['ownership']) {
    addLog(logs, `Parsing ownership data from "${sheetMap['ownership']}"...`, 'info');
    const data = getSheetData(workbook, sheetMap['ownership']);
    shareholders = parseOwnershipSheet(data, logs);
  }

  if (sheetMap['management']) {
    addLog(logs, `Parsing management control from "${sheetMap['management']}"...`, 'info');
    const data = getSheetData(workbook, sheetMap['management']);
    employees = parseMCSheet(data, logs);
  }

  if (sheetMap['procurement']) {
    addLog(logs, `Parsing procurement data from "${sheetMap['procurement']}"...`, 'info');
    const data = getSheetData(workbook, sheetMap['procurement']);
    suppliers = parseProcurementSheet(data, logs);
  }

  if (sheetMap['esd']) {
    addLog(logs, `Parsing ESD data from "${sheetMap['esd']}"...`, 'info');
    const data = getSheetData(workbook, sheetMap['esd']);
    esdContributions = parseEsdSedSheet(data, logs, 'enterprise_development');
  }

  if (sheetMap['sed']) {
    addLog(logs, `Parsing SED data from "${sheetMap['sed']}"...`, 'info');
    const data = getSheetData(workbook, sheetMap['sed']);
    sedContributions = parseEsdSedSheet(data, logs, 'socio_economic');
  }

  // Validation
  if (!client.name) { warnings.push('Client name could not be detected'); addLog(logs, 'Client name not found — using filename as fallback', 'warning'); client.name = filename.replace(/\.(xlsx?|csv)$/i, ''); }
  if (!client.revenue) { warnings.push('Revenue not detected'); addLog(logs, 'Revenue data missing', 'warning'); }
  if (!client.npat) { warnings.push('NPAT not detected'); addLog(logs, 'NPAT data missing', 'warning'); }

  const entitiesExtracted = shareholders.length + employees.length + suppliers.length + esdContributions.length + sedContributions.length;
  const dataSections = [shareholders.length > 0, employees.length > 0, suppliers.length > 0, (client.revenue || 0) > 0].filter(Boolean).length;
  const overallConfidence = Math.min(1, (sheetsMatched.reduce((s, m) => s + m.confidence, 0) / Math.max(1, sheetNames.length)) * (dataSections / 4 + 0.5));

  if (entitiesExtracted > 0) {
    addLog(logs, `Import complete! Extracted ${entitiesExtracted} entities across ${sheetsMatched.length} sheets.`, 'success');
  } else {
    addLog(logs, `Sheets were matched but no structured data rows could be extracted. The file may use a non-standard layout.`, 'warning');
    warnings.push('No data rows could be extracted from matched sheets');
  }

  return {
    success: sheetsMatched.length > 0 && (entitiesExtracted > 0 || Object.values(client).some(v => v)),
    client,
    shareholders,
    employees,
    suppliers,
    esdContributions,
    sedContributions,
    sheetsFound: sheetNames,
    sheetsMatched,
    errors,
    warnings,
    logs,
    stats: {
      totalSheets: sheetNames.length,
      matchedSheets: sheetsMatched.length,
      entitiesExtracted,
      confidence: overallConfidence,
    },
  };
}
