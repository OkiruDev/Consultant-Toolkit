import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

const sqlite = new Database("sqlite.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    organization_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    financial_year TEXT NOT NULL,
    revenue REAL DEFAULT 0,
    npat REAL DEFAULT 0,
    leviable_amount REAL DEFAULT 0,
    industry_sector TEXT DEFAULT 'Generic',
    eap_province TEXT DEFAULT 'National',
    industry_norm REAL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS financial_years (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    year TEXT NOT NULL,
    revenue REAL DEFAULT 0,
    npat REAL DEFAULT 0,
    indicative_npat REAL,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS shareholders (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    black_ownership REAL DEFAULT 0,
    black_women_ownership REAL DEFAULT 0,
    shares REAL DEFAULT 0,
    share_value REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ownership_data (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL UNIQUE,
    company_value REAL DEFAULT 0,
    outstanding_debt REAL DEFAULT 0,
    years_held REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
    race TEXT NOT NULL,
    designation TEXT NOT NULL,
    is_disabled INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS training_programs (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    cost REAL DEFAULT 0,
    employee_id TEXT,
    is_employed INTEGER DEFAULT 0,
    is_black INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    bee_level INTEGER DEFAULT 4,
    black_ownership REAL DEFAULT 0,
    spend REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS procurement_data (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL UNIQUE,
    tmps REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS esd_contributions (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    beneficiary TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL DEFAULT 0,
    category TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sed_contributions (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    beneficiary TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL DEFAULT 0,
    category TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    snapshot TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS import_logs (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    user_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    status TEXT NOT NULL,
    sheets_found INTEGER DEFAULT 0,
    sheets_matched INTEGER DEFAULT 0,
    entities_extracted INTEGER DEFAULT 0,
    errors TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS export_logs (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    export_type TEXT NOT NULL,
    file_name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expired TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    created_by_user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    due_date TEXT,
    project_name TEXT,
    assignee TEXT,
    zoho_task_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    created_by_user_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_registration TEXT,
    company_address TEXT,
    meeting_type TEXT NOT NULL,
    meeting_date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    platform TEXT NOT NULL,
    meeting_link TEXT,
    chairperson TEXT NOT NULL,
    company_secretary TEXT NOT NULL,
    venue TEXT,
    raw_notes TEXT,
    ai_executive_summary TEXT,
    ai_formatted_minutes TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS meeting_attendees (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    name TEXT NOT NULL,
    position TEXT,
    role TEXT NOT NULL DEFAULT 'attendee',
    attendance_status TEXT NOT NULL DEFAULT 'present',
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS meeting_agenda_items (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    item_number TEXT NOT NULL,
    title TEXT NOT NULL,
    discussion_notes TEXT,
    resolution TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS meeting_action_items (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    agenda_item_id TEXT,
    description TEXT NOT NULL,
    responsible_person TEXT NOT NULL,
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open'
  );
`);

export const db = drizzle(sqlite, { schema });
