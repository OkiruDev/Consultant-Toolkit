import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  role: text("role").default("user"),
  organizationId: text("organization_id"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull(),
  name: text("name").notNull(),
  financialYear: text("financial_year").notNull(),
  revenue: real("revenue").default(0),
  npat: real("npat").default(0),
  leviableAmount: real("leviable_amount").default(0),
  industrySector: text("industry_sector").default("Generic"),
  eapProvince: text("eap_province").default("National"),
  industryNorm: real("industry_norm"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const financialYears = sqliteTable("financial_years", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull(),
  year: text("year").notNull(),
  revenue: real("revenue").default(0),
  npat: real("npat").default(0),
  indicativeNpat: real("indicative_npat"),
  notes: text("notes"),
});

export const shareholders = sqliteTable("shareholders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  blackOwnership: real("black_ownership").default(0),
  blackWomenOwnership: real("black_women_ownership").default(0),
  shares: real("shares").default(0),
  shareValue: real("share_value").default(0),
});

export const ownershipData = sqliteTable("ownership_data", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull().unique(),
  companyValue: real("company_value").default(0),
  outstandingDebt: real("outstanding_debt").default(0),
  yearsHeld: real("years_held").default(0),
});

export const employees = sqliteTable("employees", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  gender: text("gender").notNull(),
  race: text("race").notNull(),
  designation: text("designation").notNull(),
  isDisabled: integer("is_disabled", { mode: "boolean" }).default(false),
});

export const trainingPrograms = sqliteTable("training_programs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  cost: real("cost").default(0),
  employeeId: text("employee_id"),
  isEmployed: integer("is_employed", { mode: "boolean" }).default(false),
  isBlack: integer("is_black", { mode: "boolean" }).default(false),
});

export const suppliers = sqliteTable("suppliers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  beeLevel: integer("bee_level").default(4),
  blackOwnership: real("black_ownership").default(0),
  spend: real("spend").default(0),
});

export const procurementData = sqliteTable("procurement_data", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull().unique(),
  tmps: real("tmps").default(0),
});

export const esdContributions = sqliteTable("esd_contributions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull(),
  beneficiary: text("beneficiary").notNull(),
  type: text("type").notNull(),
  amount: real("amount").default(0),
  category: text("category").notNull(),
});

export const sedContributions = sqliteTable("sed_contributions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull(),
  beneficiary: text("beneficiary").notNull(),
  type: text("type").notNull(),
  amount: real("amount").default(0),
  category: text("category").notNull(),
});

export const scenarios = sqliteTable("scenarios", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  snapshot: text("snapshot", { mode: "json" }).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const importLogs = sqliteTable("import_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id"),
  userId: text("user_id").notNull(),
  fileName: text("file_name").notNull(),
  status: text("status").notNull(),
  sheetsFound: integer("sheets_found").default(0),
  sheetsMatched: integer("sheets_matched").default(0),
  entitiesExtracted: integer("entities_extracted").default(0),
  errors: text("errors", { mode: "json" }),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const exportLogs = sqliteTable("export_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull(),
  userId: text("user_id").notNull(),
  exportType: text("export_type").notNull(),
  fileName: text("file_name"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// Tasks
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull(),
  createdByUserId: text("created_by_user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),
  priority: text("priority").notNull().default("medium"),
  dueDate: text("due_date"),
  projectName: text("project_name"),
  assignee: text("assignee"),
  zohoTaskId: text("zoho_task_id"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// Meeting Minutes tables
export const meetings = sqliteTable("meetings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull(),
  createdByUserId: text("created_by_user_id").notNull(),
  companyName: text("company_name").notNull(),
  companyRegistration: text("company_registration"),
  companyAddress: text("company_address"),
  meetingType: text("meeting_type").notNull(),
  meetingDate: text("meeting_date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  platform: text("platform").notNull(),
  meetingLink: text("meeting_link"),
  chairperson: text("chairperson").notNull(),
  companySecretary: text("company_secretary").notNull(),
  venue: text("venue"),
  rawNotes: text("raw_notes"),
  aiExecutiveSummary: text("ai_executive_summary"),
  aiFormattedMinutes: text("ai_formatted_minutes"),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const meetingAttendees = sqliteTable("meeting_attendees", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  meetingId: text("meeting_id").notNull(),
  name: text("name").notNull(),
  position: text("position"),
  role: text("role").notNull().default("attendee"),
  attendanceStatus: text("attendance_status").notNull().default("present"),
  sortOrder: integer("sort_order").default(0),
});

export const meetingAgendaItems = sqliteTable("meeting_agenda_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  meetingId: text("meeting_id").notNull(),
  itemNumber: text("item_number").notNull(),
  title: text("title").notNull(),
  discussionNotes: text("discussion_notes"),
  resolution: text("resolution"),
  sortOrder: integer("sort_order").default(0),
});

export const meetingActionItems = sqliteTable("meeting_action_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  meetingId: text("meeting_id").notNull(),
  agendaItemId: text("agenda_item_id"),
  description: text("description").notNull(),
  responsiblePerson: text("responsible_person").notNull(),
  dueDate: text("due_date"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("open"),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMeetingAttendeeSchema = createInsertSchema(meetingAttendees).omit({ id: true });
export const insertMeetingAgendaItemSchema = createInsertSchema(meetingAgendaItems).omit({ id: true });
export const insertMeetingActionItemSchema = createInsertSchema(meetingActionItems).omit({ id: true });

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertShareholderSchema = createInsertSchema(shareholders).omit({
  id: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
});

export const insertTrainingProgramSchema = createInsertSchema(trainingPrograms).omit({
  id: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
});

export const insertEsdContributionSchema = createInsertSchema(esdContributions).omit({
  id: true,
});

export const insertSedContributionSchema = createInsertSchema(sedContributions).omit({
  id: true,
});

export const insertScenarioSchema = createInsertSchema(scenarios).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Shareholder = typeof shareholders.$inferSelect;
export type InsertShareholder = z.infer<typeof insertShareholderSchema>;
export type OwnershipDataRow = typeof ownershipData.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type TrainingProgram = typeof trainingPrograms.$inferSelect;
export type InsertTrainingProgram = z.infer<typeof insertTrainingProgramSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type ProcurementDataRow = typeof procurementData.$inferSelect;
export type EsdContribution = typeof esdContributions.$inferSelect;
export type InsertEsdContribution = z.infer<typeof insertEsdContributionSchema>;
export type SedContribution = typeof sedContributions.$inferSelect;
export type InsertSedContribution = z.infer<typeof insertSedContributionSchema>;
export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type ImportLog = typeof importLogs.$inferSelect;
export type ExportLog = typeof exportLogs.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type MeetingAttendee = typeof meetingAttendees.$inferSelect;
export type InsertMeetingAttendee = z.infer<typeof insertMeetingAttendeeSchema>;
export type MeetingAgendaItem = typeof meetingAgendaItems.$inferSelect;
export type InsertMeetingAgendaItem = z.infer<typeof insertMeetingAgendaItemSchema>;
export type MeetingActionItem = typeof meetingActionItems.$inferSelect;
export type InsertMeetingActionItem = z.infer<typeof insertMeetingActionItemSchema>;
