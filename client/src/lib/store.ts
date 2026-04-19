import { create } from 'zustand';
import { 
  Client, OwnershipData, ManagementData, SkillsData, 
  ProcurementData, ESDData, SEDData, ScorecardResult,
  Shareholder, Employee, TrainingProgram, Supplier, Contribution, FinancialYear
} from './types';
import { v4 as uuidv4 } from "uuid";
import { api, invalidateClientData } from './api';

import { calculateOwnershipScore } from './calculators/ownership';
import { calculateManagementScore } from './calculators/management';
import { calculateSkillsScore } from './calculators/skills';
import { calculateProcurementScore } from './calculators/procurement';
import { calculateEsdScore, calculateSedScore } from './calculators/esd-sed';

export interface ScenarioSnapshot {
  id: string;
  name: string;
  createdAt: string;
  client: Client;
  ownership: OwnershipData;
  management: ManagementData;
  skills: SkillsData;
  procurement: ProcurementData;
  esd: ESDData;
  sed: SEDData;
  scorecard: ScorecardResult;
}

const emptyClient: Client = {
  id: '', name: '', financialYear: '', revenue: 0, npat: 0,
  leviableAmount: 0, industrySector: 'Generic', eapProvince: 'National',
  financialHistory: [],
};

const emptyOwnership: OwnershipData = {
  id: '', clientId: '', shareholders: [], companyValue: 0, outstandingDebt: 0, yearsHeld: 0,
};

const emptyManagement: ManagementData = { id: '', clientId: '', employees: [] };
const emptySkills: SkillsData = { id: '', clientId: '', leviableAmount: 0, trainingPrograms: [] };
const emptyProcurement: ProcurementData = { id: '', clientId: '', tmps: 0, suppliers: [] };
const emptyESD: ESDData = { id: '', clientId: '', contributions: [] };
const emptySED: SEDData = { id: '', clientId: '', contributions: [] };

const emptyScorecard: ScorecardResult = {
  ownership: { score: 0, target: 25, weighting: 25, subMinimumMet: false },
  managementControl: { score: 0, target: 19, weighting: 19 },
  skillsDevelopment: { score: 0, target: 25, weighting: 25, subMinimumMet: false },
  procurement: { score: 0, target: 29, weighting: 29, subMinimumMet: false },
  enterpriseDevelopment: { score: 0, target: 15, weighting: 15 },
  socioEconomicDevelopment: { score: 0, target: 5, weighting: 5 },
  yesInitiative: { score: 0, target: 3, weighting: 3 },
  total: { score: 0, target: 121, weighting: 121 },
  achievedLevel: 9, discountedLevel: 9, isDiscounted: false, recognitionLevel: '0%',
};

interface BbeeState {
  isLoaded: boolean;
  activeClientId: string | null;
  client: Client;
  ownership: OwnershipData;
  management: ManagementData;
  skills: SkillsData;
  procurement: ProcurementData;
  esd: ESDData;
  sed: SEDData;
  scorecard: ScorecardResult;

  isScenarioMode: boolean;
  activeScenarioId: string | null;
  scenarios: ScenarioSnapshot[];
  baseSnapshot: ScenarioSnapshot | null;

  loadClientData: (clientId: string) => Promise<void>;
  clearData: () => void;

  addShareholder: (shareholder: Shareholder) => void;
  updateShareholder: (id: string, data: Partial<Shareholder>) => void;
  removeShareholder: (id: string) => void;
  updateCompanyValue: (value: number, debt: number) => void;

  addEmployee: (employee: Employee) => void;
  removeEmployee: (id: string) => void;

  addTrainingProgram: (program: TrainingProgram) => void;
  removeTrainingProgram: (id: string) => void;

  addSupplier: (supplier: Supplier) => void;
  removeSupplier: (id: string) => void;

  addEsdContribution: (contribution: Contribution) => void;
  removeEsdContribution: (id: string) => void;

  addSedContribution: (contribution: Contribution) => void;
  removeSedContribution: (id: string) => void;
  
  updateFinancials: (revenue: number, npat: number, leviableAmount: number, industryNorm?: number) => void;
  updateTMPS: (tmps: number) => void;
  updateSettings: (eapProvince: string, industrySector: string) => void;

  addFinancialYear: (year: FinancialYear) => void;
  updateFinancialYear: (id: string, data: Partial<FinancialYear>) => void;
  removeFinancialYear: (id: string) => void;
  
  createScenario: (name: string) => void;
  switchScenario: (id: string | null) => void;
  deleteScenario: (id: string) => void;
  
  _recalculateAll: () => void;
}

function calculateScorecard(state: { ownership: OwnershipData; management: ManagementData; skills: SkillsData; procurement: ProcurementData; esd: ESDData; sed: SEDData; client: Client }): ScorecardResult {
  const ownScore = calculateOwnershipScore(state.ownership);
  const mgtScore = calculateManagementScore(state.management);
  const skillScore = calculateSkillsScore(state.skills);
  const procScore = calculateProcurementScore(state.procurement);
  const esdScore = calculateEsdScore(state.esd, state.client.npat);
  const sedScore = calculateSedScore(state.sed, state.client.npat);

  const totalPoints = ownScore.total + mgtScore.total + skillScore.total + procScore.total + esdScore.total + sedScore.total;
  
  let level = 8;
  if (totalPoints >= 100) level = 1;
  else if (totalPoints >= 95) level = 2;
  else if (totalPoints >= 90) level = 3;
  else if (totalPoints >= 80) level = 4;
  else if (totalPoints >= 75) level = 5;
  else if (totalPoints >= 70) level = 6;
  else if (totalPoints >= 55) level = 7;
  else if (totalPoints >= 40) level = 8;
  else level = 9;

  const isDiscounted = !ownScore.subMinimumMet || !skillScore.subMinimumMet || !procScore.subMinimumMet;
  const discountedLevel = isDiscounted ? Math.min(level + 1, 9) : level;
  const recognitionLevel = discountedLevel === 9 ? '0%' : `${[135, 125, 110, 100, 80, 60, 50, 10][discountedLevel-1]}%`;

  return {
    ownership: { score: ownScore.total, target: 25, weighting: 25, subMinimumMet: ownScore.subMinimumMet },
    managementControl: { score: mgtScore.total, target: 19, weighting: 19 },
    skillsDevelopment: { score: skillScore.total, target: 25, weighting: 25, subMinimumMet: skillScore.subMinimumMet },
    procurement: { score: procScore.total, target: 29, weighting: 29, subMinimumMet: procScore.subMinimumMet },
    enterpriseDevelopment: { score: esdScore.total, target: 15, weighting: 15 },
    socioEconomicDevelopment: { score: sedScore.total, target: 5, weighting: 5 },
    yesInitiative: { score: 0, target: 3, weighting: 3 },
    total: { score: totalPoints, target: 121, weighting: 121 },
    achievedLevel: level, discountedLevel, isDiscounted, recognitionLevel,
  };
}

export const useBbeeStore = create<BbeeState>((set, get) => ({
  isLoaded: false,
  activeClientId: null,
  client: emptyClient,
  ownership: emptyOwnership,
  management: emptyManagement,
  skills: emptySkills,
  procurement: emptyProcurement,
  esd: emptyESD,
  sed: emptySED,
  scorecard: emptyScorecard,

  isScenarioMode: false,
  activeScenarioId: null,
  scenarios: [],
  baseSnapshot: null,

  loadClientData: async (clientId: string) => {
    try {
      const data = await api.getClientData(clientId);
      
      const clientData: Client = {
        id: data.client.id,
        name: data.client.name,
        financialYear: data.client.financialYear || '',
        revenue: data.client.revenue || 0,
        npat: data.client.npat || 0,
        leviableAmount: data.client.leviableAmount || 0,
        industrySector: data.client.industrySector || 'Generic',
        eapProvince: data.client.eapProvince || 'National',
        industryNorm: data.client.industryNorm,
        financialHistory: (data.financialYears || []).map((fy: any) => ({
          id: fy.id,
          year: fy.year,
          revenue: fy.revenue || 0,
          npat: fy.npat || 0,
          indicativeNpat: fy.indicativeNpat,
          notes: fy.notes,
        })),
      };

      const ownershipState: OwnershipData = {
        id: data.ownership?.id || '',
        clientId,
        shareholders: (data.ownership?.shareholders || []).map((sh: any) => ({
          id: sh.id,
          name: sh.name,
          blackOwnership: sh.blackOwnership || 0,
          blackWomenOwnership: sh.blackWomenOwnership || 0,
          shares: sh.shares || 0,
          shareValue: sh.shareValue || 0,
        })),
        companyValue: data.ownership?.companyValue || 0,
        outstandingDebt: data.ownership?.outstandingDebt || 0,
        yearsHeld: data.ownership?.yearsHeld || 0,
      };

      const managementState: ManagementData = {
        id: '',
        clientId,
        employees: (data.management?.employees || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          gender: e.gender,
          race: e.race,
          designation: e.designation,
          isDisabled: e.isDisabled || false,
        })),
      };

      const skillsState: SkillsData = {
        id: '',
        clientId,
        leviableAmount: data.skills?.leviableAmount || clientData.leviableAmount || 0,
        trainingPrograms: (data.skills?.trainingPrograms || []).map((tp: any) => ({
          id: tp.id,
          name: tp.name,
          category: tp.category,
          cost: tp.cost || 0,
          employeeId: tp.employeeId,
          isEmployed: tp.isEmployed || false,
          isBlack: tp.isBlack || false,
        })),
      };

      const procurementState: ProcurementData = {
        id: '',
        clientId,
        tmps: data.procurement?.tmps || 0,
        suppliers: (data.procurement?.suppliers || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          beeLevel: s.beeLevel || 4,
          blackOwnership: s.blackOwnership || 0,
          spend: s.spend || 0,
        })),
      };

      const esdState: ESDData = {
        id: '',
        clientId,
        contributions: (data.esd?.contributions || []).map((c: any) => ({
          id: c.id,
          beneficiary: c.beneficiary,
          type: c.type,
          amount: c.amount || 0,
          category: c.category,
        })),
      };

      const sedState: SEDData = {
        id: '',
        clientId,
        contributions: (data.sed?.contributions || []).map((c: any) => ({
          id: c.id,
          beneficiary: c.beneficiary,
          type: c.type,
          amount: c.amount || 0,
          category: c.category,
        })),
      };

      const scenariosData = (data.scenarios || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        createdAt: s.createdAt,
        ...s.snapshot,
      }));

      set({
        isLoaded: true,
        activeClientId: clientId,
        client: clientData,
        ownership: ownershipState,
        management: managementState,
        skills: skillsState,
        procurement: procurementState,
        esd: esdState,
        sed: sedState,
        scenarios: scenariosData,
        isScenarioMode: false,
        activeScenarioId: null,
        baseSnapshot: null,
      });

      get()._recalculateAll();
    } catch (error) {
      console.error('Failed to load client data:', error);
      set({ isLoaded: false, activeClientId: null });
    }
  },

  clearData: () => {
    set({
      isLoaded: false,
      activeClientId: null,
      client: emptyClient,
      ownership: emptyOwnership,
      management: emptyManagement,
      skills: emptySkills,
      procurement: emptyProcurement,
      esd: emptyESD,
      sed: emptySED,
      scorecard: emptyScorecard,
      isScenarioMode: false,
      activeScenarioId: null,
      scenarios: [],
      baseSnapshot: null,
    });
  },

  createScenario: (name: string) => {
    const state = get();
    const baseToSave = state.isScenarioMode ? state.baseSnapshot! : {
      id: 'base', name: 'Base Scenario', createdAt: new Date().toISOString(),
      client: JSON.parse(JSON.stringify(state.client)),
      ownership: JSON.parse(JSON.stringify(state.ownership)),
      management: JSON.parse(JSON.stringify(state.management)),
      skills: JSON.parse(JSON.stringify(state.skills)),
      procurement: JSON.parse(JSON.stringify(state.procurement)),
      esd: JSON.parse(JSON.stringify(state.esd)),
      sed: JSON.parse(JSON.stringify(state.sed)),
      scorecard: JSON.parse(JSON.stringify(state.scorecard)),
    };

    const newScenario: ScenarioSnapshot = {
      id: uuidv4(), name, createdAt: new Date().toISOString(),
      client: JSON.parse(JSON.stringify(state.client)),
      ownership: JSON.parse(JSON.stringify(state.ownership)),
      management: JSON.parse(JSON.stringify(state.management)),
      skills: JSON.parse(JSON.stringify(state.skills)),
      procurement: JSON.parse(JSON.stringify(state.procurement)),
      esd: JSON.parse(JSON.stringify(state.esd)),
      sed: JSON.parse(JSON.stringify(state.sed)),
      scorecard: JSON.parse(JSON.stringify(state.scorecard)),
    };

    if (state.activeClientId) {
      api.addScenario(state.activeClientId, { name, snapshot: newScenario }).catch(console.error);
    }

    set({ scenarios: [...state.scenarios, newScenario], baseSnapshot: baseToSave });
    get().switchScenario(newScenario.id);
  },

  switchScenario: (id: string | null) => {
    const state = get();
    if (state.isScenarioMode && state.activeScenarioId) {
      const updatedScenarios = state.scenarios.map(s => {
        if (s.id === state.activeScenarioId) {
          return { ...s, client: state.client, ownership: state.ownership, management: state.management, skills: state.skills, procurement: state.procurement, esd: state.esd, sed: state.sed, scorecard: state.scorecard };
        }
        return s;
      });
      set({ scenarios: updatedScenarios });
    } else if (!state.isScenarioMode) {
      set({
        baseSnapshot: {
          id: 'base', name: 'Base Scenario', createdAt: new Date().toISOString(),
          client: state.client, ownership: state.ownership, management: state.management,
          skills: state.skills, procurement: state.procurement, esd: state.esd, sed: state.sed, scorecard: state.scorecard,
        }
      });
    }

    if (id === null) {
      if (state.baseSnapshot) {
        set({ isScenarioMode: false, activeScenarioId: null, client: state.baseSnapshot.client, ownership: state.baseSnapshot.ownership, management: state.baseSnapshot.management, skills: state.baseSnapshot.skills, procurement: state.baseSnapshot.procurement, esd: state.baseSnapshot.esd, sed: state.baseSnapshot.sed, scorecard: state.baseSnapshot.scorecard });
      }
    } else {
      const targetScenario = state.scenarios.find(s => s.id === id);
      if (targetScenario) {
        set({ isScenarioMode: true, activeScenarioId: id, client: JSON.parse(JSON.stringify(targetScenario.client)), ownership: JSON.parse(JSON.stringify(targetScenario.ownership)), management: JSON.parse(JSON.stringify(targetScenario.management)), skills: JSON.parse(JSON.stringify(targetScenario.skills)), procurement: JSON.parse(JSON.stringify(targetScenario.procurement)), esd: JSON.parse(JSON.stringify(targetScenario.esd)), sed: JSON.parse(JSON.stringify(targetScenario.sed)), scorecard: JSON.parse(JSON.stringify(targetScenario.scorecard)) });
      }
    }
  },

  deleteScenario: (id: string) => {
    const state = get();
    if (state.activeScenarioId === id) get().switchScenario(null);
    set((state) => ({ scenarios: state.scenarios.filter(s => s.id !== id) }));
    api.deleteScenario(id).catch(console.error);
  },

  _recalculateAll: () => set((state) => ({
    scorecard: calculateScorecard(state),
  })),

  addFinancialYear: (year) => {
    set((state) => ({ client: { ...state.client, financialHistory: [...state.client.financialHistory, year] } }));
    const state = get();
    if (state.activeClientId) {
      api.addFinancialYear(state.activeClientId, { year: year.year, revenue: year.revenue, npat: year.npat, indicativeNpat: year.indicativeNpat, notes: year.notes }).catch(console.error);
    }
  },
  updateFinancialYear: (id, data) => {
    set((state) => ({ client: { ...state.client, financialHistory: state.client.financialHistory.map(y => y.id === id ? { ...y, ...data } : y) } }));
  },
  removeFinancialYear: (id) => {
    set((state) => ({ client: { ...state.client, financialHistory: state.client.financialHistory.filter(y => y.id !== id) } }));
    api.deleteFinancialYear(id).catch(console.error);
  },

  addShareholder: (shareholder) => {
    set((state) => ({ ownership: { ...state.ownership, shareholders: [...state.ownership.shareholders, shareholder] } }));
    get()._recalculateAll();
    const state = get();
    if (state.activeClientId) {
      api.addShareholder(state.activeClientId, {
        name: shareholder.name,
        blackOwnership: shareholder.blackOwnership,
        blackWomenOwnership: shareholder.blackWomenOwnership,
        shares: shareholder.shares,
        shareValue: shareholder.shareValue,
      }).catch(console.error);
    }
  },
  updateShareholder: (id, data) => {
    set((state) => ({ ownership: { ...state.ownership, shareholders: state.ownership.shareholders.map(sh => sh.id === id ? { ...sh, ...data } : sh) } }));
    get()._recalculateAll();
    api.updateShareholder(id, data).catch(console.error);
  },
  removeShareholder: (id) => {
    set((state) => ({ ownership: { ...state.ownership, shareholders: state.ownership.shareholders.filter(sh => sh.id !== id) } }));
    get()._recalculateAll();
    api.deleteShareholder(id).catch(console.error);
  },
  updateCompanyValue: (companyValue, outstandingDebt) => {
    set((state) => ({ ownership: { ...state.ownership, companyValue, outstandingDebt } }));
    get()._recalculateAll();
    const state = get();
    if (state.activeClientId) {
      api.updateOwnership(state.activeClientId, { companyValue, outstandingDebt }).catch(console.error);
    }
  },

  addEmployee: (employee) => {
    set((state) => ({ management: { ...state.management, employees: [...state.management.employees, employee] } }));
    get()._recalculateAll();
    const state = get();
    if (state.activeClientId) {
      api.addEmployee(state.activeClientId, {
        name: employee.name, gender: employee.gender, race: employee.race,
        designation: employee.designation, isDisabled: employee.isDisabled,
      }).catch(console.error);
    }
  },
  removeEmployee: (id) => {
    set((state) => ({ management: { ...state.management, employees: state.management.employees.filter(e => e.id !== id) } }));
    get()._recalculateAll();
    api.deleteEmployee(id).catch(console.error);
  },

  addTrainingProgram: (program) => {
    set((state) => ({ skills: { ...state.skills, trainingPrograms: [...state.skills.trainingPrograms, program] } }));
    get()._recalculateAll();
    const state = get();
    if (state.activeClientId) {
      api.addTrainingProgram(state.activeClientId, {
        name: program.name, category: program.category, cost: program.cost,
        employeeId: program.employeeId, isEmployed: program.isEmployed, isBlack: program.isBlack,
      }).catch(console.error);
    }
  },
  removeTrainingProgram: (id) => {
    set((state) => ({ skills: { ...state.skills, trainingPrograms: state.skills.trainingPrograms.filter(p => p.id !== id) } }));
    get()._recalculateAll();
    api.deleteTrainingProgram(id).catch(console.error);
  },

  addSupplier: (supplier) => {
    set((state) => ({ procurement: { ...state.procurement, suppliers: [...state.procurement.suppliers, supplier] } }));
    get()._recalculateAll();
    const state = get();
    if (state.activeClientId) {
      api.addSupplier(state.activeClientId, {
        name: supplier.name, beeLevel: supplier.beeLevel,
        blackOwnership: supplier.blackOwnership, spend: supplier.spend,
      }).catch(console.error);
    }
  },
  removeSupplier: (id) => {
    set((state) => ({ procurement: { ...state.procurement, suppliers: state.procurement.suppliers.filter(s => s.id !== id) } }));
    get()._recalculateAll();
    api.deleteSupplier(id).catch(console.error);
  },

  addEsdContribution: (contribution) => {
    set((state) => ({ esd: { ...state.esd, contributions: [...state.esd.contributions, contribution] } }));
    get()._recalculateAll();
    const state = get();
    if (state.activeClientId) {
      api.addEsdContribution(state.activeClientId, {
        beneficiary: contribution.beneficiary, type: contribution.type,
        amount: contribution.amount, category: contribution.category,
      }).catch(console.error);
    }
  },
  removeEsdContribution: (id) => {
    set((state) => ({ esd: { ...state.esd, contributions: state.esd.contributions.filter(c => c.id !== id) } }));
    get()._recalculateAll();
    api.deleteEsdContribution(id).catch(console.error);
  },

  addSedContribution: (contribution) => {
    set((state) => ({ sed: { ...state.sed, contributions: [...state.sed.contributions, contribution] } }));
    get()._recalculateAll();
    const state = get();
    if (state.activeClientId) {
      api.addSedContribution(state.activeClientId, {
        beneficiary: contribution.beneficiary, type: contribution.type,
        amount: contribution.amount, category: contribution.category,
      }).catch(console.error);
    }
  },
  removeSedContribution: (id) => {
    set((state) => ({ sed: { ...state.sed, contributions: state.sed.contributions.filter(c => c.id !== id) } }));
    get()._recalculateAll();
    api.deleteSedContribution(id).catch(console.error);
  },

  updateFinancials: (revenue, npat, leviableAmount, industryNorm) => {
    set((state) => ({
      client: { ...state.client, revenue, npat, leviableAmount, industryNorm },
      skills: { ...state.skills, leviableAmount }
    }));
    get()._recalculateAll();
    const state = get();
    if (state.activeClientId) {
      api.updateClient(state.activeClientId, { revenue, npat, leviableAmount, industryNorm }).catch(console.error);
    }
  },
  
  updateTMPS: (tmps) => {
    set((state) => ({ procurement: { ...state.procurement, tmps } }));
    get()._recalculateAll();
    const state = get();
    if (state.activeClientId) {
      api.updateProcurement(state.activeClientId, tmps).catch(console.error);
    }
  },
  
  updateSettings: (eapProvince, industrySector) => {
    // @ts-ignore
    set((state) => ({ client: { ...state.client, eapProvince, industrySector } }));
    get()._recalculateAll();
    const state = get();
    if (state.activeClientId) {
      api.updateClient(state.activeClientId, { eapProvince, industrySector }).catch(console.error);
    }
  }
}));
