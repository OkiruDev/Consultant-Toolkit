export interface FinancialYear {
  id: string;
  year: string;
  revenue: number;
  npat: number;
  indicativeNpat?: number;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  financialYear: string;
  revenue: number;
  npat: number;
  leviableAmount: number;
  industrySector: string;
  eapProvince: 'Gauteng' | 'Western Cape' | 'KZN' | 'Eastern Cape' | 'National';
  industryNorm?: number; // Added to store the applied norm
  financialHistory: FinancialYear[];
}

export interface Shareholder {
  id: string;
  name: string;
  blackOwnership: number;      // 0-1
  blackWomenOwnership: number; // 0-1
  shares: number;
  shareValue: number;
}

export interface OwnershipData {
  id: string;
  clientId: string;
  shareholders: Shareholder[];
  companyValue: number;
  outstandingDebt: number;
  yearsHeld: number;
}

export interface Employee {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  race: 'African' | 'Coloured' | 'Indian' | 'White';
  designation: 'Board' | 'Executive' | 'Senior' | 'Middle' | 'Junior';
  isDisabled: boolean;
}

export interface ManagementData {
  id: string;
  clientId: string;
  employees: Employee[];
}

export interface TrainingProgram {
  id: string;
  name: string;
  category: 'bursary' | 'learnership' | 'apprenticeship' | 'short course';
  cost: number;
  employeeId?: string;
  isEmployed: boolean;
  isBlack: boolean;
}

export interface SkillsData {
  id: string;
  clientId: string;
  leviableAmount: number;
  trainingPrograms: TrainingProgram[];
}

export interface Supplier {
  id: string;
  name: string;
  beeLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 0; // 0 for Non-Compliant
  blackOwnership: number; // 0-1
  spend: number;
}

export interface ProcurementData {
  id: string;
  clientId: string;
  tmps: number; // Total Measured Procurement Spend
  suppliers: Supplier[];
}

export interface Contribution {
  id: string;
  beneficiary: string;
  type: 'grant' | 'interest_free_loan' | 'lower_interest_loan' | 'overhead_costs' | 'professional_services' | 'employee_time';
  amount: number;
  category: 'supplier_development' | 'enterprise_development' | 'socio_economic';
}

export interface ESDData {
  id: string;
  clientId: string;
  contributions: Contribution[];
}

export interface SEDData {
  id: string;
  clientId: string;
  contributions: Contribution[];
}

export interface ScorecardResult {
  ownership: { score: number; target: number; weighting: number; subMinimumMet: boolean };
  managementControl: { score: number; target: number; weighting: number };
  skillsDevelopment: { score: number; target: number; weighting: number; subMinimumMet: boolean };
  procurement: { score: number; target: number; weighting: number; subMinimumMet: boolean };
  enterpriseDevelopment: { score: number; target: number; weighting: number };
  socioEconomicDevelopment: { score: number; target: number; weighting: number };
  yesInitiative: { score: number; target: number; weighting: number };
  total: { score: number; target: number; weighting: number };
  achievedLevel: number;
  discountedLevel: number;
  isDiscounted: boolean;
  recognitionLevel: string;
}
