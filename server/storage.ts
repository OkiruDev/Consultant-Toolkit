import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  users, organizations, clients, financialYears,
  shareholders, ownershipData, employees, trainingPrograms,
  suppliers, procurementData, esdContributions, sedContributions,
  scenarios, importLogs, exportLogs,
  meetings, meetingAttendees, meetingAgendaItems, meetingActionItems, tasks,
  type User, type InsertUser, type Organization, type InsertOrganization,
  type Client, type InsertClient, type Shareholder, type InsertShareholder,
  type OwnershipDataRow, type Employee, type InsertEmployee,
  type TrainingProgram, type InsertTrainingProgram,
  type Supplier, type InsertSupplier, type ProcurementDataRow,
  type EsdContribution, type InsertEsdContribution,
  type SedContribution, type InsertSedContribution,
  type Scenario, type InsertScenario, type ImportLog, type ExportLog,
  type Meeting, type InsertMeeting,
  type MeetingAttendee, type InsertMeetingAttendee,
  type MeetingAgendaItem, type InsertMeetingAgendaItem,
  type MeetingActionItem, type InsertMeetingActionItem,
  type Task, type InsertTask,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { organizationId?: string }): Promise<User>;

  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | undefined>;

  getClientsByOrg(orgId: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, data: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<void>;

  getFinancialYears(clientId: string): Promise<typeof financialYears.$inferSelect[]>;
  createFinancialYear(data: any): Promise<typeof financialYears.$inferSelect>;
  deleteFinancialYear(id: string): Promise<void>;

  getShareholdersByClient(clientId: string): Promise<Shareholder[]>;
  createShareholder(data: InsertShareholder): Promise<Shareholder>;
  updateShareholder(id: string, data: Partial<InsertShareholder>): Promise<Shareholder | undefined>;
  deleteShareholder(id: string): Promise<void>;

  getOwnershipData(clientId: string): Promise<OwnershipDataRow | undefined>;
  upsertOwnershipData(clientId: string, data: { companyValue?: number; outstandingDebt?: number; yearsHeld?: number }): Promise<OwnershipDataRow>;

  getEmployeesByClient(clientId: string): Promise<Employee[]>;
  createEmployee(data: InsertEmployee): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;

  getTrainingProgramsByClient(clientId: string): Promise<TrainingProgram[]>;
  createTrainingProgram(data: InsertTrainingProgram): Promise<TrainingProgram>;
  deleteTrainingProgram(id: string): Promise<void>;

  getSuppliersByClient(clientId: string): Promise<Supplier[]>;
  createSupplier(data: InsertSupplier): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;

  getProcurementData(clientId: string): Promise<ProcurementDataRow | undefined>;
  upsertProcurementData(clientId: string, tmps: number): Promise<ProcurementDataRow>;

  getEsdContributions(clientId: string): Promise<EsdContribution[]>;
  createEsdContribution(data: InsertEsdContribution): Promise<EsdContribution>;
  deleteEsdContribution(id: string): Promise<void>;

  getSedContributions(clientId: string): Promise<SedContribution[]>;
  createSedContribution(data: InsertSedContribution): Promise<SedContribution>;
  deleteSedContribution(id: string): Promise<void>;

  getScenariosByClient(clientId: string): Promise<Scenario[]>;
  createScenario(data: InsertScenario): Promise<Scenario>;
  deleteScenario(id: string): Promise<void>;

  createImportLog(data: any): Promise<ImportLog>;
  getImportLogs(clientId: string): Promise<ImportLog[]>;

  createExportLog(data: any): Promise<ExportLog>;
  getExportLogs(clientId: string): Promise<ExportLog[]>;

  getMeetingsByOrg(orgId: string): Promise<Meeting[]>;
  getMeeting(id: string): Promise<Meeting | undefined>;
  getMeetingWithDetails(id: string): Promise<{ meeting: Meeting; attendees: MeetingAttendee[]; agendaItems: MeetingAgendaItem[]; actionItems: MeetingActionItem[] } | undefined>;
  createMeeting(data: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, data: Partial<InsertMeeting>): Promise<Meeting | undefined>;
  deleteMeeting(id: string): Promise<void>;

  replaceAttendees(meetingId: string, attendees: InsertMeetingAttendee[]): Promise<MeetingAttendee[]>;
  replaceAgendaItems(meetingId: string, items: InsertMeetingAgendaItem[]): Promise<MeetingAgendaItem[]>;
  replaceActionItems(meetingId: string, items: InsertMeetingActionItem[]): Promise<MeetingActionItem[]>;

  getTasksByOrg(orgId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { organizationId?: string }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [result] = await db.insert(organizations).values(org).returning();
    return result;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [result] = await db.select().from(organizations).where(eq(organizations.id, id));
    return result;
  }

  async getClientsByOrg(orgId: string): Promise<Client[]> {
    return db.select().from(clients).where(eq(clients.organizationId, orgId));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [result] = await db.select().from(clients).where(eq(clients.id, id));
    return result;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [result] = await db.insert(clients).values(client).returning();
    return result;
  }

  async updateClient(id: string, data: Partial<InsertClient>): Promise<Client | undefined> {
    const [result] = await db.update(clients).set(data).where(eq(clients.id, id)).returning();
    return result;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  async getFinancialYears(clientId: string) {
    return db.select().from(financialYears).where(eq(financialYears.clientId, clientId));
  }

  async createFinancialYear(data: any) {
    const [result] = await db.insert(financialYears).values(data).returning();
    return result;
  }

  async deleteFinancialYear(id: string): Promise<void> {
    await db.delete(financialYears).where(eq(financialYears.id, id));
  }

  async getShareholdersByClient(clientId: string): Promise<Shareholder[]> {
    return db.select().from(shareholders).where(eq(shareholders.clientId, clientId));
  }

  async createShareholder(data: InsertShareholder): Promise<Shareholder> {
    const [result] = await db.insert(shareholders).values(data).returning();
    return result;
  }

  async updateShareholder(id: string, data: Partial<InsertShareholder>): Promise<Shareholder | undefined> {
    const [result] = await db.update(shareholders).set(data).where(eq(shareholders.id, id)).returning();
    return result;
  }

  async deleteShareholder(id: string): Promise<void> {
    await db.delete(shareholders).where(eq(shareholders.id, id));
  }

  async getOwnershipData(clientId: string): Promise<OwnershipDataRow | undefined> {
    const [result] = await db.select().from(ownershipData).where(eq(ownershipData.clientId, clientId));
    return result;
  }

  async upsertOwnershipData(clientId: string, data: { companyValue?: number; outstandingDebt?: number; yearsHeld?: number }): Promise<OwnershipDataRow> {
    const existing = await this.getOwnershipData(clientId);
    if (existing) {
      const [result] = await db.update(ownershipData).set(data).where(eq(ownershipData.clientId, clientId)).returning();
      return result;
    }
    const [result] = await db.insert(ownershipData).values({ clientId, ...data }).returning();
    return result;
  }

  async getEmployeesByClient(clientId: string): Promise<Employee[]> {
    return db.select().from(employees).where(eq(employees.clientId, clientId));
  }

  async createEmployee(data: InsertEmployee): Promise<Employee> {
    const [result] = await db.insert(employees).values(data).returning();
    return result;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async getTrainingProgramsByClient(clientId: string): Promise<TrainingProgram[]> {
    return db.select().from(trainingPrograms).where(eq(trainingPrograms.clientId, clientId));
  }

  async createTrainingProgram(data: InsertTrainingProgram): Promise<TrainingProgram> {
    const [result] = await db.insert(trainingPrograms).values(data).returning();
    return result;
  }

  async deleteTrainingProgram(id: string): Promise<void> {
    await db.delete(trainingPrograms).where(eq(trainingPrograms.id, id));
  }

  async getSuppliersByClient(clientId: string): Promise<Supplier[]> {
    return db.select().from(suppliers).where(eq(suppliers.clientId, clientId));
  }

  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [result] = await db.insert(suppliers).values(data).returning();
    return result;
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async getProcurementData(clientId: string): Promise<ProcurementDataRow | undefined> {
    const [result] = await db.select().from(procurementData).where(eq(procurementData.clientId, clientId));
    return result;
  }

  async upsertProcurementData(clientId: string, tmps: number): Promise<ProcurementDataRow> {
    const existing = await this.getProcurementData(clientId);
    if (existing) {
      const [result] = await db.update(procurementData).set({ tmps }).where(eq(procurementData.clientId, clientId)).returning();
      return result;
    }
    const [result] = await db.insert(procurementData).values({ clientId, tmps }).returning();
    return result;
  }

  async getEsdContributions(clientId: string): Promise<EsdContribution[]> {
    return db.select().from(esdContributions).where(eq(esdContributions.clientId, clientId));
  }

  async createEsdContribution(data: InsertEsdContribution): Promise<EsdContribution> {
    const [result] = await db.insert(esdContributions).values(data).returning();
    return result;
  }

  async deleteEsdContribution(id: string): Promise<void> {
    await db.delete(esdContributions).where(eq(esdContributions.id, id));
  }

  async getSedContributions(clientId: string): Promise<SedContribution[]> {
    return db.select().from(sedContributions).where(eq(sedContributions.clientId, clientId));
  }

  async createSedContribution(data: InsertSedContribution): Promise<SedContribution> {
    const [result] = await db.insert(sedContributions).values(data).returning();
    return result;
  }

  async deleteSedContribution(id: string): Promise<void> {
    await db.delete(sedContributions).where(eq(sedContributions.id, id));
  }

  async getScenariosByClient(clientId: string): Promise<Scenario[]> {
    return db.select().from(scenarios).where(eq(scenarios.clientId, clientId));
  }

  async createScenario(data: InsertScenario): Promise<Scenario> {
    const [result] = await db.insert(scenarios).values(data).returning();
    return result;
  }

  async deleteScenario(id: string): Promise<void> {
    await db.delete(scenarios).where(eq(scenarios.id, id));
  }

  async createImportLog(data: any): Promise<ImportLog> {
    const [result] = await db.insert(importLogs).values(data).returning();
    return result;
  }

  async getImportLogs(clientId: string): Promise<ImportLog[]> {
    return db.select().from(importLogs).where(eq(importLogs.clientId, clientId));
  }

  async createExportLog(data: any): Promise<ExportLog> {
    const [result] = await db.insert(exportLogs).values(data).returning();
    return result;
  }

  async getExportLogs(clientId: string): Promise<ExportLog[]> {
    return db.select().from(exportLogs).where(eq(exportLogs.clientId, clientId));
  }

  async getMeetingsByOrg(orgId: string): Promise<Meeting[]> {
    return db.select().from(meetings).where(eq(meetings.organizationId, orgId));
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    const [result] = await db.select().from(meetings).where(eq(meetings.id, id));
    return result;
  }

  async getMeetingWithDetails(id: string) {
    const meeting = await this.getMeeting(id);
    if (!meeting) return undefined;
    const [attendeesResult, agendaResult, actionResult] = await Promise.all([
      db.select().from(meetingAttendees).where(eq(meetingAttendees.meetingId, id)),
      db.select().from(meetingAgendaItems).where(eq(meetingAgendaItems.meetingId, id)),
      db.select().from(meetingActionItems).where(eq(meetingActionItems.meetingId, id)),
    ]);
    return {
      meeting,
      attendees: attendeesResult.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      agendaItems: agendaResult.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      actionItems: actionResult,
    };
  }

  async createMeeting(data: InsertMeeting): Promise<Meeting> {
    const [result] = await db.insert(meetings).values(data).returning();
    return result;
  }

  async updateMeeting(id: string, data: Partial<InsertMeeting>): Promise<Meeting | undefined> {
    const [result] = await db.update(meetings).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(meetings.id, id)).returning();
    return result;
  }

  async deleteMeeting(id: string): Promise<void> {
    await Promise.all([
      db.delete(meetingAttendees).where(eq(meetingAttendees.meetingId, id)),
      db.delete(meetingAgendaItems).where(eq(meetingAgendaItems.meetingId, id)),
      db.delete(meetingActionItems).where(eq(meetingActionItems.meetingId, id)),
    ]);
    await db.delete(meetings).where(eq(meetings.id, id));
  }

  async replaceAttendees(meetingId: string, attendees: InsertMeetingAttendee[]): Promise<MeetingAttendee[]> {
    await db.delete(meetingAttendees).where(eq(meetingAttendees.meetingId, meetingId));
    if (attendees.length === 0) return [];
    return db.insert(meetingAttendees).values(attendees.map((a, i) => ({ ...a, meetingId, sortOrder: i }))).returning();
  }

  async replaceAgendaItems(meetingId: string, items: InsertMeetingAgendaItem[]): Promise<MeetingAgendaItem[]> {
    await db.delete(meetingAgendaItems).where(eq(meetingAgendaItems.meetingId, meetingId));
    if (items.length === 0) return [];
    return db.insert(meetingAgendaItems).values(items.map((item, i) => ({ ...item, meetingId, sortOrder: i }))).returning();
  }

  async replaceActionItems(meetingId: string, items: InsertMeetingActionItem[]): Promise<MeetingActionItem[]> {
    await db.delete(meetingActionItems).where(eq(meetingActionItems.meetingId, meetingId));
    if (items.length === 0) return [];
    return db.insert(meetingActionItems).values(items.map(item => ({ ...item, meetingId }))).returning();
  }

  async getTasksByOrg(orgId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.organizationId, orgId));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [result] = await db.select().from(tasks).where(eq(tasks.id, id));
    return result;
  }

  async createTask(data: InsertTask): Promise<Task> {
    const [result] = await db.insert(tasks).values(data).returning();
    return result;
  }

  async updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [result] = await db.update(tasks).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(tasks.id, id)).returning();
    return result;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }
}

export const storage = new DatabaseStorage();
