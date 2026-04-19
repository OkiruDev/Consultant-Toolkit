Here’s a structured `README.md` for your B-BBEE platform MVP project:

---

# B-BBEE Compliance & Strategy Platform

## Overview

This platform provides a modern, interactive B-BBEE compliance and strategy tool. It is designed to replace complex Excel toolkits with a web application that:

* Uses Excel as the source of truth for regulatory data
* Automates B-BBEE Generic Scorecard calculations (Ownership, MC, Skills, Procurement, ESD, SED, YES)
* Enables powerful what-if scenario planning
* Exports dashboards, strategy packs, and slide templates for internal or client use

Initially developed for internal use in Johannesburg, with future licensing potential.

---

## Features

### Excel Import & Parsing

* Bulk Excel & PDF upload
* Automatic sheet and column detection
* JSON normalization for internal calculations
* Validation against strict schema
* Mapping review screen for user approval

### Pillar Scorecards

* **Ownership (25 pts)** – Voting Rights, Economic Interest, Net Value, BWO & other subcategories
* **Management Control (19 pts)** – Board, Exec, Senior/Middle/Junior Management, Disabilities
* **Skills Development (25 pts)** – Levy spend, bursaries, absorption, disability bonuses
* **Preferential Procurement (29 pts)** – Level 1–4, QSE/EME, black-owned spend, designated group bonuses
* **Enterprise & Supplier Development (17 pts)** – Supplier & enterprise development contributions
* **Socio-Economic Development (5 pts)** – NPAT-based spend
* **YES Enhancer (up to +3 levels)** – Youth Employment contribution

### Financials & TMPS

* Editable revenue, NPAT, and TMPS tables
* Deemed NPAT calculations
* Leviable amounts feeding pillar calculations

### Scenario Planning

* Create multiple scenarios from base data
* Intervention builder (e.g., hires, bursaries, procurement shifts)
* Instant recalculation and side-by-side comparison
* Cost vs points efficiency and level predictions
* Waterfall charts and visual indicators

### Dashboard & Reporting

* Live dashboard per pillar
* Gap analysis and level tracking
* Export to Excel, PowerPoint slides, and strategy packs
* Draft rule toggles (e.g., Transformation Fund preview)

---

## Technology Stack

**Frontend:**

* React + TailwindCSS
* Component-based architecture: ImportPage, FileDropZone, UploadQueue, ParsingStatus, MappingReview, ImportSummary

**Backend:**

* Python (FastAPI recommended)
* Calculation engine per pillar
* Excel parsing: `openpyxl`, `pandas`, `rapidfuzz`
* PDF parsing: `pdfplumber`
* JSON validation: `pydantic`

**Data:**

* Source Excel templates (v1.0 / v1.4)
* Stats SA P0044 quarterly norms (2021–2025)

---

## Project Structure (Suggested)

```
/backend
    /core
        ownership.py
        management_control.py
        skills.py
        procurement.py
        esd.py
        sed.py
        yes.py
        scorecard.py
    /parsing
        excel_parser.py
        pdf_parser.py
    /schemas
        models.py
/frontend
    /components
        FileDropZone.jsx
        UploadQueue.jsx
        ParsingStatus.jsx
        MappingReview.jsx
        ImportSummary.jsx
    /pages
        ImportPage.jsx
        Dashboard.jsx
        ScenarioPlanner.jsx
/docs
    README.md
    UserGuide.md
```

---

## Getting Started

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-org/bbbee-platform.git
cd bbbee-platform
```

2. Setup backend environment:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. Setup frontend environment:

```bash
cd frontend
npm install
npm run dev
```

4. Run backend server:

```bash
uvicorn backend.main:app --reload
```

5. Navigate to `http://localhost:3000` to use the platform.

---

## Usage

1. Go to the **Import** tab to upload Excel/PDF files.
2. Review auto-detected sheets and column mappings.
3. Validate data and save.
4. Navigate to the **Dashboard** to view calculated pillar scores.
5. Create scenarios in **Scenario Planner** to simulate interventions.
6. Export dashboards, slides, or strategy packs.

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Ensure new calculations match Excel outputs
4. Open a pull request with description

---

## License

MIT License

---

## Notes

* Platform currently implements B-BBEE Codes 2019; draft 2026 amendments are included as toggles for preview.
* Calculation engine must be validated against source Excel to ensure compliance.

---

I can also draft a **sample `requirements.txt` and `package.json`** next so your repo is ready to run end-to-end. Do you want me to do that?
