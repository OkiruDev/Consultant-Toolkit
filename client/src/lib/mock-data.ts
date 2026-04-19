import { 
  Client, 
  OwnershipData, 
  ManagementData, 
  SkillsData, 
  ProcurementData, 
  ESDData, 
  SEDData,
  ScorecardResult
} from './types';

export const mockClient: Client = {
  id: 'client-1',
  name: 'Acme Corporation SA',
  financialYear: '2024',
  revenue: 150000000, // 150M ZAR
  npat: 15000000,    // 15M ZAR
  leviableAmount: 45000000, // Payroll
  industrySector: 'Generic',
  eapProvince: 'National',
  financialHistory: [
    { id: "fh1", year: "2023", revenue: 140000000, npat: 14000000 },
    { id: "fh2", year: "2022", revenue: 135000000, npat: 13800000 },
    { id: "fh3", year: "2021", revenue: 120000000, npat: 13500000 },
  ]
};

export const mockOwnership: OwnershipData = {
  id: 'own-1',
  clientId: 'client-1',
  companyValue: 500000000, // 500M ZAR
  outstandingDebt: 50000000,
  yearsHeld: 3,
  shareholders: [
    {
      id: 'sh-1',
      name: 'Thabo Mbeki Investment Trust',
      blackOwnership: 1,
      blackWomenOwnership: 0.4,
      shares: 30,
      shareValue: 150000000
    },
    {
      id: 'sh-2',
      name: 'Global Ventures Holdings',
      blackOwnership: 0,
      blackWomenOwnership: 0,
      shares: 70,
      shareValue: 350000000
    }
  ]
};

export const mockManagement: ManagementData = {
  id: 'mgt-1',
  clientId: 'client-1',
  employees: [
    { id: 'emp-1', name: 'Sipho Ndlovu', gender: 'Male', race: 'African', designation: 'Board', isDisabled: false },
    { id: 'emp-2', name: 'Sarah Jenkins', gender: 'Female', race: 'White', designation: 'Board', isDisabled: false },
    { id: 'emp-3', name: 'Lerato Khumalo', gender: 'Female', race: 'African', designation: 'Executive', isDisabled: false },
    { id: 'emp-4', name: 'Johan Van Der Merwe', gender: 'Male', race: 'White', designation: 'Executive', isDisabled: false },
    { id: 'emp-5', name: 'Priya Patel', gender: 'Female', race: 'Indian', designation: 'Senior', isDisabled: false },
    { id: 'emp-6', name: 'Michael Smith', gender: 'Male', race: 'White', designation: 'Senior', isDisabled: true },
    { id: 'emp-7', name: 'Zanele Dlamini', gender: 'Female', race: 'African', designation: 'Middle', isDisabled: false },
    { id: 'emp-8', name: 'Kagiso Zwane', gender: 'Male', race: 'African', designation: 'Junior', isDisabled: false },
  ]
};

export const mockSkills: SkillsData = {
  id: 'skills-1',
  clientId: 'client-1',
  leviableAmount: 45000000,
  trainingPrograms: [
    { id: 'tp-1', name: 'IT Leadership Bursary', category: 'bursary', cost: 120000, isEmployed: true, isBlack: true, employeeId: 'emp-3' },
    { id: 'tp-2', name: 'Data Science Learnership', category: 'learnership', cost: 85000, isEmployed: false, isBlack: true },
    { id: 'tp-3', name: 'Management Short Course', category: 'short course', cost: 45000, isEmployed: true, isBlack: false, employeeId: 'emp-4' },
    { id: 'tp-4', name: 'Technical Apprenticeship', category: 'apprenticeship', cost: 110000, isEmployed: false, isBlack: true },
  ]
};

export const mockProcurement: ProcurementData = {
  id: 'proc-1',
  clientId: 'client-1',
  tmps: 80000000, // 80M ZAR
  suppliers: [
    { id: 'sup-1', name: 'Ndlovu IT Solutions', beeLevel: 1, blackOwnership: 1.0, spend: 15000000 },
    { id: 'sup-2', name: 'National Logistics', beeLevel: 4, blackOwnership: 0.25, spend: 25000000 },
    { id: 'sup-3', name: 'Global Tech Corp', beeLevel: 8, blackOwnership: 0, spend: 30000000 },
    { id: 'sup-4', name: 'Mvelaphanda Consulting', beeLevel: 2, blackOwnership: 0.51, spend: 10000000 },
  ]
};

export const mockESD: ESDData = {
  id: 'esd-1',
  clientId: 'client-1',
  contributions: [
    { id: 'esd-c1', beneficiary: 'Ndlovu IT Solutions', type: 'grant', amount: 500000, category: 'supplier_development' },
    { id: 'esd-c2', beneficiary: 'StartUp Hub Inc', type: 'interest_free_loan', amount: 1200000, category: 'enterprise_development' },
    { id: 'esd-c3', beneficiary: 'Mvelaphanda Consulting', type: 'professional_services', amount: 150000, category: 'supplier_development' },
  ]
};

export const mockSED: SEDData = {
  id: 'sed-1',
  clientId: 'client-1',
  contributions: [
    { id: 'sed-c1', beneficiary: 'Rural Education Fund', type: 'grant', amount: 250000, category: 'socio_economic' },
    { id: 'sed-c2', beneficiary: 'Youth Sports Initiative', type: 'grant', amount: 100000, category: 'socio_economic' },
  ]
};

// Calculate initial mockup scores based on standard Generic Codes
export const mockScorecardResult: ScorecardResult = {
  ownership: { score: 21.5, target: 25, weighting: 25, subMinimumMet: true },
  managementControl: { score: 12.8, target: 19, weighting: 19 },
  skillsDevelopment: { score: 16.4, target: 20, weighting: 25, subMinimumMet: true }, // Max 25 points
  procurement: { score: 24.1, target: 29, weighting: 29, subMinimumMet: false }, // Fails sub-minimum for demo
  enterpriseDevelopment: { score: 12.0, target: 15, weighting: 15 },
  socioEconomicDevelopment: { score: 5.0, target: 5, weighting: 5 },
  yesInitiative: { score: 0, target: 3, weighting: 3 },
  total: { score: 91.8, target: 121, weighting: 121 },
  achievedLevel: 3,
  discountedLevel: 4,
  isDiscounted: true,
  recognitionLevel: '100%'
};