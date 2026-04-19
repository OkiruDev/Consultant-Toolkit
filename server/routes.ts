import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { parseExcelBuffer } from "./lib/excelParser";
import bcrypt from "bcrypt";
import session from "express-session";
import createMemoryStore from "memorystore";
import Anthropic from "@anthropic-ai/sdk";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/pdf',
      'application/octet-stream',
    ];
    if (allowed.includes(file.mimetype) || /\.(xlsx?|csv|pdf)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type.'));
    }
  },
});

declare module 'express-session' {
  interface SessionData {
    userId: string;
    organizationId: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

async function verifyClientAccess(req: Request, res: Response): Promise<boolean> {
  const clientId = req.params.id;
  if (!clientId) return true;
  const client = await storage.getClient(clientId);
  if (!client) {
    res.status(404).json({ message: "Client not found" });
    return false;
  }
  if (client.organizationId !== req.session.organizationId) {
    res.status(403).json({ message: "Access denied" });
    return false;
  }
  return true;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const MemoryStore = createMemoryStore(session);

  app.use(session({
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
    secret: process.env.SESSION_SECRET || 'okiru-pro-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }));

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, password, fullName, email, organizationName } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Username already taken" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const org = await storage.createOrganization({ name: organizationName || `${username}'s Organization` });
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        fullName: fullName || username,
        email: email || null,
        organizationId: org.id,
      });

      req.session.userId = user.id;
      req.session.organizationId = org.id;

      return res.json({
        user: { id: user.id, username: user.username, fullName: user.fullName, email: user.email, role: user.role, organizationId: org.id },
        organization: org,
      });
    } catch (error: any) {
      console.error('Register error:', error);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.organizationId = user.organizationId || '';

      return res.json({
        user: { id: user.id, username: user.username, fullName: user.fullName, email: user.email, role: user.role, organizationId: user.organizationId },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get('/api/auth/me', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    return res.json({
      user: { id: user.id, username: user.username, fullName: user.fullName, email: user.email, role: user.role, organizationId: user.organizationId },
    });
  });

  app.get('/api/clients', requireAuth, async (req: Request, res: Response) => {
    const orgId = req.session.organizationId!;
    const result = await storage.getClientsByOrg(orgId);
    return res.json(result);
  });

  app.post('/api/clients', requireAuth, async (req: Request, res: Response) => {
    try {
      const orgId = req.session.organizationId!;
      const client = await storage.createClient({ ...req.body, organizationId: orgId });
      await storage.upsertOwnershipData(client.id, { companyValue: 0, outstandingDebt: 0, yearsHeld: 0 });
      await storage.upsertProcurementData(client.id, 0);
      return res.json(client);
    } catch (error: any) {
      console.error('Create client error:', error);
      return res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.get('/api/clients/:id', requireAuth, async (req: Request, res: Response) => {
    if (!(await verifyClientAccess(req, res))) return;
    const client = await storage.getClient(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    return res.json(client);
  });

  app.patch('/api/clients/:id', requireAuth, async (req: Request, res: Response) => {
    if (!(await verifyClientAccess(req, res))) return;
    const client = await storage.updateClient(req.params.id, req.body);
    if (!client) return res.status(404).json({ message: "Client not found" });
    return res.json(client);
  });

  app.delete('/api/clients/:id', requireAuth, async (req: Request, res: Response) => {
    if (!(await verifyClientAccess(req, res))) return;
    await storage.deleteClient(req.params.id);
    return res.json({ message: "Deleted" });
  });

  app.get('/api/clients/:id/data', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!(await verifyClientAccess(req, res))) return;
      const clientId = req.params.id;
      const client = await storage.getClient(clientId);
      if (!client) return res.status(404).json({ message: "Client not found" });

      const [
        financialYearsData, shareholdersData, ownershipDataResult,
        employeesData, trainingProgramsData, suppliersData, procurementDataResult,
        esdData, sedData, scenariosData
      ] = await Promise.all([
        storage.getFinancialYears(clientId),
        storage.getShareholdersByClient(clientId),
        storage.getOwnershipData(clientId),
        storage.getEmployeesByClient(clientId),
        storage.getTrainingProgramsByClient(clientId),
        storage.getSuppliersByClient(clientId),
        storage.getProcurementData(clientId),
        storage.getEsdContributions(clientId),
        storage.getSedContributions(clientId),
        storage.getScenariosByClient(clientId),
      ]);

      return res.json({
        client,
        financialYears: financialYearsData,
        ownership: {
          ...(ownershipDataResult || { companyValue: 0, outstandingDebt: 0, yearsHeld: 0 }),
          shareholders: shareholdersData,
        },
        management: { employees: employeesData },
        skills: { leviableAmount: client.leviableAmount || 0, trainingPrograms: trainingProgramsData },
        procurement: { tmps: procurementDataResult?.tmps || 0, suppliers: suppliersData },
        esd: { contributions: esdData },
        sed: { contributions: sedData },
        scenarios: scenariosData,
      });
    } catch (error: any) {
      console.error('Get client data error:', error);
      return res.status(500).json({ message: "Failed to load client data" });
    }
  });

  app.post('/api/clients/:id/shareholders', requireAuth, async (req: Request, res: Response) => {
    if (!(await verifyClientAccess(req, res))) return;
    const result = await storage.createShareholder({ ...req.body, clientId: req.params.id });
    return res.json(result);
  });

  app.delete('/api/shareholders/:id', requireAuth, async (req: Request, res: Response) => {
    await storage.deleteShareholder(req.params.id);
    return res.json({ message: "Deleted" });
  });

  app.patch('/api/shareholders/:id', requireAuth, async (req: Request, res: Response) => {
    const result = await storage.updateShareholder(req.params.id, req.body);
    return res.json(result);
  });

  app.patch('/api/clients/:id/ownership', requireAuth, async (req: Request, res: Response) => {
    if (!(await verifyClientAccess(req, res))) return;
    const result = await storage.upsertOwnershipData(req.params.id, req.body);
    return res.json(result);
  });

  app.post('/api/clients/:id/employees', requireAuth, async (req: Request, res: Response) => {
    if (!(await verifyClientAccess(req, res))) return;
    const result = await storage.createEmployee({ ...req.body, clientId: req.params.id });
    return res.json(result);
  });

  app.delete('/api/employees/:id', requireAuth, async (req: Request, res: Response) => {
    await storage.deleteEmployee(req.params.id);
    return res.json({ message: "Deleted" });
  });

  app.post('/api/clients/:id/training-programs', requireAuth, async (req: Request, res: Response) => {
    if (!(await verifyClientAccess(req, res))) return;
    const result = await storage.createTrainingProgram({ ...req.body, clientId: req.params.id });
    return res.json(result);
  });

  app.delete('/api/training-programs/:id', requireAuth, async (req: Request, res: Response) => {
    await storage.deleteTrainingProgram(req.params.id);
    return res.json({ message: "Deleted" });
  });

  app.post('/api/clients/:id/suppliers', requireAuth, async (req: Request, res: Response) => {
    if (!(await verifyClientAccess(req, res))) return;
    const result = await storage.createSupplier({ ...req.body, clientId: req.params.id });
    return res.json(result);
  });

  app.delete('/api/suppliers/:id', requireAuth, async (req: Request, res: Response) => {
    await storage.deleteSupplier(req.params.id);
    return res.json({ message: "Deleted" });
  });

  app.patch('/api/clients/:id/procurement', requireAuth, async (req: Request, res: Response) => {
    if (!(await verifyClientAccess(req, res))) return;
    const result = await storage.upsertProcurementData(req.params.id, req.body.tmps);
    return res.json(result);
  });

  app.post('/api/clients/:id/esd-contributions', requireAuth, async (req: Request, res: Response) => {
    if (!(await verifyClientAccess(req, res))) return;
    const result = await storage.createEsdContribution({ ...req.body, clientId: req.params.id });
    return res.json(result);
  });

  app.delete('/api/esd-contributions/:id', requireAuth, async (req: Request, res: Response) => {
    await storage.deleteEsdContribution(req.params.id);
    return res.json({ message: "Deleted" });
  });

  app.post('/api/clients/:id/sed-contributions', requireAuth, async (req: Request, res: Response) => {
    if (!(await verifyClientAccess(req, res))) return;
    const result = await storage.createSedContribution({ ...req.body, clientId: req.params.id });
    return res.json(result);
  });

  app.delete('/api/sed-contributions/:id', requireAuth, async (req: Request, res: Response) => {
    await storage.deleteSedContribution(req.params.id);
    return res.json({ message: "Deleted" });
  });

  app.post('/api/clients/:id/scenarios', requireAuth, async (req: Request, res: Response) => {
    if (!(await verifyClientAccess(req, res))) return;
    const result = await storage.createScenario({ ...req.body, clientId: req.params.id });
    return res.json(result);
  });

  app.delete('/api/scenarios/:id', requireAuth, async (req: Request, res: Response) => {
    await storage.deleteScenario(req.params.id);
    return res.json({ message: "Deleted" });
  });

  app.post('/api/clients/:id/financial-years', requireAuth, async (req: Request, res: Response) => {
    if (!(await verifyClientAccess(req, res))) return;
    const result = await storage.createFinancialYear({ ...req.body, clientId: req.params.id });
    return res.json(result);
  });

  app.delete('/api/financial-years/:id', requireAuth, async (req: Request, res: Response) => {
    await storage.deleteFinancialYear(req.params.id);
    return res.json({ message: "Deleted" });
  });

  app.post('/api/import/excel', upload.array('files', 10), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      const emptyResult = {
        success: false, client: {}, shareholders: [], employees: [], suppliers: [],
        esdContributions: [], sedContributions: [], sheetsFound: [], sheetsMatched: [],
        errors: [] as string[], warnings: [], logs: [] as { message: string; type: string; timestamp: string }[],
        stats: { totalSheets: 0, matchedSheets: 0, entitiesExtracted: 0, confidence: 0 },
      };

      if (!files || files.length === 0) {
        return res.status(400).json({ ...emptyResult, errors: ['No files were uploaded.'], logs: [{ message: 'No files received', type: 'error', timestamp: new Date().toISOString() }] });
      }

      const excelFile = files.find(f => /\.(xlsx?|csv)$/i.test(f.originalname));
      if (!excelFile) {
        return res.status(400).json({ ...emptyResult, errors: ['No Excel file found in upload.'], logs: [{ message: 'No Excel file in upload batch', type: 'error', timestamp: new Date().toISOString() }] });
      }

      const result = parseExcelBuffer(excelFile.buffer, excelFile.originalname);

      if (req.session.userId) {
        try {
          await storage.createImportLog({
            userId: req.session.userId,
            clientId: req.body.clientId || null,
            fileName: excelFile.originalname,
            status: result.success ? 'success' : 'failed',
            sheetsFound: result.stats?.totalSheets || 0,
            sheetsMatched: result.stats?.matchedSheets || 0,
            entitiesExtracted: result.stats?.entitiesExtracted || 0,
            errors: result.errors || [],
          });
        } catch (logErr) {
          console.error('Failed to log import:', logErr);
        }
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Import error:', error);
      return res.status(500).json({
        success: false, client: {}, shareholders: [], employees: [], suppliers: [],
        esdContributions: [], sedContributions: [], sheetsFound: [], sheetsMatched: [],
        errors: [error.message || 'An unexpected error occurred during import.'], warnings: [],
        logs: [{ message: `Server error: ${error.message}`, type: 'error', timestamp: new Date().toISOString() }],
        stats: { totalSheets: 0, matchedSheets: 0, entitiesExtracted: 0, confidence: 0 },
      });
    }
  });

  app.post('/api/export-log', requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await storage.createExportLog({
        ...req.body,
        userId: req.session.userId!,
      });
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ message: "Failed to log export" });
    }
  });

  app.get('/api/clients/:id/export-logs', requireAuth, async (req: Request, res: Response) => {
    if (!(await verifyClientAccess(req, res))) return;
    const logs = await storage.getExportLogs(req.params.id);
    return res.json(logs);
  });

  // ── Tasks ────────────────────────────────────────────────────────────────────

  app.get('/api/tasks', requireAuth, async (req: Request, res: Response) => {
    const result = await storage.getTasksByOrg(req.session.organizationId!);
    return res.json(result.sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')));
  });

  app.post('/api/tasks', requireAuth, async (req: Request, res: Response) => {
    try {
      const task = await storage.createTask({
        ...req.body,
        organizationId: req.session.organizationId!,
        createdByUserId: req.session.userId!,
      });
      return res.json(task);
    } catch (error: any) {
      return res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch('/api/tasks/:id', requireAuth, async (req: Request, res: Response) => {
    const existing = await storage.getTask(req.params.id);
    if (!existing) return res.status(404).json({ message: "Task not found" });
    if (existing.organizationId !== req.session.organizationId) return res.status(403).json({ message: "Access denied" });
    const updated = await storage.updateTask(req.params.id, req.body);
    return res.json(updated);
  });

  app.delete('/api/tasks/:id', requireAuth, async (req: Request, res: Response) => {
    const existing = await storage.getTask(req.params.id);
    if (!existing) return res.status(404).json({ message: "Task not found" });
    if (existing.organizationId !== req.session.organizationId) return res.status(403).json({ message: "Access denied" });
    await storage.deleteTask(req.params.id);
    return res.json({ message: "Deleted" });
  });

  // ── Chat (streaming) ──────────────────────────────────────────────────────────

  app.post('/api/chat', requireAuth, async (req: Request, res: Response) => {
    try {
      const { messages, context } = req.body as {
        messages: Array<{ role: 'user' | 'assistant'; content: string }>;
        context?: { meetings?: number; tasks?: number; pendingTasks?: number };
      };

      const systemPrompt = `You are the Okiru Companion AI — an intelligent executive assistant for Okiru consultants working in B-BBEE compliance, corporate governance, and company secretarial practice in South Africa.

PERSONALITY: Proactive, precise, and professional. You think like a Chief of Staff — anticipating needs, prioritising ruthlessly, and surfacing what matters most. You are direct without being curt.

CORE CAPABILITIES:
- Meeting intelligence: draft agendas, produce minutes, extract action items, track resolutions
- Task & deadline management: identify overdue items, flag risks, suggest reprioritisation using urgency × importance (Eisenhower Matrix)
- B-BBEE expertise: explain scoring, thresholds, ownership calculations, QSE vs generic scorecard, BEE codes, sector charters
- Company secretarial practice: AGM/EGM procedure, Companies Act (71 of 2008) compliance, King IV principles, MOI amendments
- Document guidance: help locate, structure, or draft governance documents and board packs
- Learning: explain concepts, walk through frameworks, provide practical examples
- Prioritisation coaching: when asked what to do next, synthesise context into 3 clear next actions with reasoning

SMART BEHAVIOURS:
- "Pick up where I left off" → analyse task + meeting context provided, give TOP 3 priority actions with deadlines
- "Check deliverables" → identify what's overdue or at risk, state the consequence, recommend the immediate action
- "Find a document" → ask clarifying questions: what type, which company, which date range
- "Learn a skill" → present a numbered menu of relevant topics, then teach the chosen one step by step
- "What to prioritise" → use urgency × importance framing, be specific about WHY each item ranks where it does

RESPONSE STYLE:
- Lead with the most important point first
- Use bullet points for 3+ items; bold key terms and **deadlines**
- Keep answers concise unless depth is requested — a sharp paragraph beats a wall of text
- End action-oriented responses with "What would you like to tackle first?" if there are clear follow-ups
- For B-BBEE answers, cite the relevant code section or gazette where applicable

Current workspace context:
${context?.meetings !== undefined ? `- Meetings on record: ${context.meetings}` : ''}
${context?.tasks !== undefined ? `- Total tasks: ${context.tasks}` : ''}
${context?.pendingTasks !== undefined ? `- Pending/in-progress tasks: ${context.pendingTasks}` : ''}`;

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages,
      });

      stream.on('text', (text) => {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      });

      stream.on('message', () => {
        res.write('data: [DONE]\n\n');
        res.end();
      });

      stream.on('error', (err) => {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      });

    } catch (error: any) {
      if (!res.headersSent) {
        return res.status(500).json({ message: error.message || "Chat failed" });
      }
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  });

  // ── Voice: Speech-to-Text (OpenAI Whisper) ───────────────────────────────────

  app.post('/api/voice/transcribe', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "OPENAI_API_KEY not configured" });
      }
      const { audio, mimeType = 'audio/webm' } = req.body as { audio: string; mimeType?: string };
      if (!audio) return res.status(400).json({ message: "No audio provided" });

      const buffer = Buffer.from(audio, 'base64');
      const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';

      const formData = new FormData();
      const blob = new Blob([buffer], { type: mimeType });
      formData.append('file', blob, `audio.${ext}`);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: formData as any,
      });

      if (!response.ok) throw new Error(await response.text());
      const data = await response.json() as { text: string };
      return res.json({ transcript: data.text });
    } catch (error: any) {
      console.error('Transcription error:', error.message);
      return res.status(500).json({ message: error.message || 'Transcription failed' });
    }
  });

  // ── Voice: Text-to-Speech (OpenAI TTS) ───────────────────────────────────────

  app.post('/api/voice/speak', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "OPENAI_API_KEY not configured" });
      }
      const { text, voice = 'nova' } = req.body as { text: string; voice?: string };
      if (!text) return res.status(400).json({ message: "No text provided" });

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'tts-1', input: text.slice(0, 4096), voice, response_format: 'mp3' }),
      });

      if (!response.ok) throw new Error(await response.text());
      res.setHeader('Content-Type', 'audio/mpeg');
      const buf = Buffer.from(await response.arrayBuffer());
      return res.send(buf);
    } catch (error: any) {
      console.error('TTS error:', error.message);
      return res.status(500).json({ message: error.message || 'TTS failed' });
    }
  });


  // ── Meeting Minutes ──────────────────────────────────────────────────────────

  app.get('/api/meetings', requireAuth, async (req: Request, res: Response) => {
    const orgId = req.session.organizationId!;
    const result = await storage.getMeetingsByOrg(orgId);
    return res.json(result.sort((a, b) => b.meetingDate.localeCompare(a.meetingDate)));
  });

  app.post('/api/meetings', requireAuth, async (req: Request, res: Response) => {
    try {
      const orgId = req.session.organizationId!;
      const userId = req.session.userId!;
      const meeting = await storage.createMeeting({ ...req.body, organizationId: orgId, createdByUserId: userId });
      return res.json(meeting);
    } catch (error: any) {
      return res.status(500).json({ message: "Failed to create meeting" });
    }
  });

  app.get('/api/meetings/:id', requireAuth, async (req: Request, res: Response) => {
    const details = await storage.getMeetingWithDetails(req.params.id);
    if (!details) return res.status(404).json({ message: "Meeting not found" });
    if (details.meeting.organizationId !== req.session.organizationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    return res.json(details);
  });

  app.patch('/api/meetings/:id', requireAuth, async (req: Request, res: Response) => {
    const existing = await storage.getMeeting(req.params.id);
    if (!existing) return res.status(404).json({ message: "Meeting not found" });
    if (existing.organizationId !== req.session.organizationId) return res.status(403).json({ message: "Access denied" });
    const updated = await storage.updateMeeting(req.params.id, req.body);
    return res.json(updated);
  });

  app.delete('/api/meetings/:id', requireAuth, async (req: Request, res: Response) => {
    const existing = await storage.getMeeting(req.params.id);
    if (!existing) return res.status(404).json({ message: "Meeting not found" });
    if (existing.organizationId !== req.session.organizationId) return res.status(403).json({ message: "Access denied" });
    await storage.deleteMeeting(req.params.id);
    return res.json({ message: "Deleted" });
  });

  app.put('/api/meetings/:id/attendees', requireAuth, async (req: Request, res: Response) => {
    const existing = await storage.getMeeting(req.params.id);
    if (!existing) return res.status(404).json({ message: "Meeting not found" });
    if (existing.organizationId !== req.session.organizationId) return res.status(403).json({ message: "Access denied" });
    const result = await storage.replaceAttendees(req.params.id, req.body);
    return res.json(result);
  });

  app.put('/api/meetings/:id/agenda-items', requireAuth, async (req: Request, res: Response) => {
    const existing = await storage.getMeeting(req.params.id);
    if (!existing) return res.status(404).json({ message: "Meeting not found" });
    if (existing.organizationId !== req.session.organizationId) return res.status(403).json({ message: "Access denied" });
    const result = await storage.replaceAgendaItems(req.params.id, req.body);
    return res.json(result);
  });

  app.put('/api/meetings/:id/action-items', requireAuth, async (req: Request, res: Response) => {
    const existing = await storage.getMeeting(req.params.id);
    if (!existing) return res.status(404).json({ message: "Meeting not found" });
    if (existing.organizationId !== req.session.organizationId) return res.status(403).json({ message: "Access denied" });
    const result = await storage.replaceActionItems(req.params.id, req.body);
    return res.json(result);
  });

  app.post('/api/meetings/:id/generate', requireAuth, async (req: Request, res: Response) => {
    try {
      const details = await storage.getMeetingWithDetails(req.params.id);
      if (!details) return res.status(404).json({ message: "Meeting not found" });
      if (details.meeting.organizationId !== req.session.organizationId) return res.status(403).json({ message: "Access denied" });

      const { meeting, attendees, agendaItems, actionItems } = details;

      const platformLabel: Record<string, string> = {
        google_meet: "Google Meet", teams: "Microsoft Teams",
        zoom: "Zoom", zoho_meet: "Zoho Meeting", in_person: "In-Person",
      };
      const meetingTypeLabel: Record<string, string> = {
        board: "Board Meeting", agm: "Annual General Meeting",
        egm: "Extraordinary General Meeting", exco: "Executive Committee Meeting",
        audit: "Audit Committee Meeting", remco: "Remuneration Committee Meeting",
        other: "Meeting",
      };

      const present = attendees.filter(a => a.attendanceStatus !== "apology" && a.attendanceStatus !== "absent");
      const apologies = attendees.filter(a => a.attendanceStatus === "apology" || a.attendanceStatus === "absent");
      const attendanceList = [
        "PRESENT:",
        ...present.map((a, i) => `  ${i + 1}. ${a.name} – ${a.position || "N/A"} (${a.role})`),
        apologies.length ? "\nAPOLOGIES:" : "",
        ...apologies.map((a, i) => `  ${i + 1}. ${a.name} – ${a.position || "N/A"}`),
      ].filter(Boolean).join("\n");

      const agendaList = agendaItems
        .map(item => [
          `${item.itemNumber}. ${item.title}`,
          item.discussionNotes ? `   Discussion Notes: ${item.discussionNotes}` : "",
          item.resolution ? `   Proposed Resolution: ${item.resolution}` : "",
        ].filter(Boolean).join("\n"))
        .join("\n\n");

      const actionList = actionItems
        .map((a, i) => `${i + 1}. ${a.description} | Responsible: ${a.responsiblePerson} | Due: ${a.dueDate || "TBC"} | Priority: ${a.priority}`)
        .join("\n");

      const userMessage = `
MEETING DETAILS:
Company: ${meeting.companyName}${meeting.companyRegistration ? ` (Reg: ${meeting.companyRegistration})` : ""}
Meeting Type: ${meetingTypeLabel[meeting.meetingType] || meeting.meetingType}
Date: ${meeting.meetingDate}
Time: ${meeting.startTime || "N/A"}${meeting.endTime ? ` – ${meeting.endTime}` : ""}
Platform: ${platformLabel[meeting.platform] || meeting.platform}${meeting.meetingLink ? ` (${meeting.meetingLink})` : ""}
Venue: ${meeting.venue || "Virtual"}
Chairperson: ${meeting.chairperson}
Company Secretary: ${meeting.companySecretary}

ATTENDANCE REGISTER:
${attendanceList || "No attendees recorded."}

AGENDA ITEMS:
${agendaList || "No agenda items recorded."}

ACTION ITEMS:
${actionList || "No action items recorded."}

RAW NOTES / TRANSCRIPT:
${meeting.rawNotes || "No raw notes provided."}

Generate the meeting minutes as JSON with exactly two keys:

1. "executiveSummary": A 3–5 sentence formal executive summary covering: (a) purpose and type of meeting, (b) key decisions and resolutions passed, (c) critical action items and accountable persons, (d) any matters deferred. Written in third person, past tense.

2. "formattedMinutes": Complete formal company secretary minutes structured as follows — use the exact section headings below, numbered as shown:

MINUTES OF THE [MEETING TYPE] OF [COMPANY NAME]
Held on [DATE] at [TIME] via [PLATFORM/VENUE]

1. CALL TO ORDER
   State time the Chairperson declared the meeting open.

2. PRESENT AND IN ATTENDANCE
   List directors / members present by name and designation. List guests / observers. Record the Company Secretary.

3. APOLOGIES
   List names of directors who submitted apologies.

4. CONFIRMATION OF QUORUM
   Formal statement confirming a quorum is present and the meeting is duly constituted to conduct business.

5. CONFLICTS OF INTEREST
   Record any declared conflicts, or "No conflicts of interest were declared."

6. APPROVAL OF PREVIOUS MINUTES
   Record motion to approve, proposer, seconder, and resolution: "RESOLVED: That the minutes of the previous meeting be approved as a true and correct record."

7. AGENDA ITEMS (numbered per the agenda provided)
   For each item:
   - Brief factual summary of matters presented/discussed (neutral language, no verbatim transcript)
   - Points considered FOR and AGAINST material decisions (where applicable)
   - Any RESOLUTION in the format: "RESOLVED: [exact wording]. Proposed by [name]. Seconded by [name]. CARRIED/FAILED [unanimously / by X votes to Y, Z abstentions]."

8. GENERAL / ANY OTHER BUSINESS
   Record any additional matters raised.

9. NEXT MEETING
   Record the agreed date and time of the next meeting, or note it will be communicated.

10. ADJOURNMENT
    Record the time the Chairperson declared the meeting adjourned.

ACTION ITEMS REGISTER
After the numbered sections, include a plain-text table with columns: No. | Action | Responsible Person | Due Date | Priority
Use tab separation between columns. List all action items.

Do not include signature blocks. Respond ONLY with valid JSON.`;

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: `You are a senior company secretary and corporate governance professional producing legally compliant board minutes under the South African Companies Act.

STANDARDS TO FOLLOW:
- Minutes are a legal record: use neutral, objective, impersonal language. Never record every comment — focus on decisions, resolutions, and actions.
- Every resolution must be clearly worded, with proposer, seconder (where applicable), and vote outcome (unanimous / carried / failed / abstentions noted).
- Conflicts of interest and executive session entries must be recorded if present.
- Use formal section numbering throughout.
- Action items must identify WHO is responsible, WHAT must be done, and by WHEN.
- Quorum must be formally confirmed before substantive business.
- Do not include subjective commentary, personal opinions, or confidential deliberations verbatim.

Always respond with valid JSON only.`,
        messages: [{ role: "user", content: userMessage }],
      });

      const rawContent = message.content[0].type === "text" ? message.content[0].text : "";
      let executiveSummary = "";
      let formattedMinutes = "";

      try {
        const cleaned = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
        const parsed = JSON.parse(cleaned);
        executiveSummary = parsed.executiveSummary || "";
        formattedMinutes = parsed.formattedMinutes || "";
      } catch {
        formattedMinutes = rawContent;
        executiveSummary = "Executive summary could not be parsed. Please review the formatted minutes.";
      }

      const updated = await storage.updateMeeting(req.params.id, {
        aiExecutiveSummary: executiveSummary,
        aiFormattedMinutes: formattedMinutes,
        status: "generated",
      });

      return res.json(updated);
    } catch (error: any) {
      console.error("Meeting generation error:", error);
      return res.status(500).json({ message: error.message || "Failed to generate meeting minutes" });
    }
  });

  return httpServer;
}
