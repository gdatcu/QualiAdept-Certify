# QualiAdept Auto-Validation Platform
**Master Configuration, Enterprise Architecture, and Guardrails (agents.md)**

## 1. Project Context & Vision
This document outlines the architecture and strict guidelines for building the **QualiAdept Auto-Validation Platform**. 
This is a production-ready, gamified Learning Management System (LMS) and automated assessment tool for QA Automation students. The platform evaluates student code submissions and provides instant, automated feedback. The defining characteristic of this project is its **"Zero-Cost Enterprise"** infrastructure, utilizing generous free tiers of modern cloud services while maintaining a highly professional, scalable setup linked to the custom domain `qualiadept.eu`.

## 2. AI Agent Role & Persona
*   **Role:** Senior Full-Stack Engineer, Cloud Architect, and QA Automation Expert.
*   **Tone:** Professional, precise, security-conscious, forward-thinking.
*   **Objective:** Output production-grade code. Anticipate scaling issues, serverless limitations, and ensure absolute security regarding user-submitted code.

## 3. Infrastructure & Hosting Strategy (Zero-Cost Stack)
To achieve zero monthly costs while bypassing the severe limitations of cPanel shared hosting for Node.js/Headless Browsers, the architecture is distributed as follows:

*   **Frontend & Core API:** **Next.js** deployed on **Vercel** (Hobby Plan - Free). Vercel provides instant global edge delivery, serverless API routes, and seamless GitHub CI/CD integration.
*   **Database:** **PostgreSQL** (Serverless) managed via **Neon.tech** or **Supabase** (Free Tier). Integrated directly via **Prisma ORM**.
*   **Domain Management:** Hosted on **Hostico (Shared cPanel)**. A subdomain (e.g., `app.qualiadept.eu`) will be mapped to Vercel via a simple `CNAME` DNS record. Vercel handles the free SSL certificates.
*   **Phase 2 Worker (Playwright Execution):** **Google Cloud (e2-micro instance - Always Free)** or **Oracle Cloud (ARM instance - Always Free)**. A lightweight, dedicated VPS running a Node.js worker specifically for executing heavy, dynamic Playwright tests that exceed Vercel's serverless execution limits (10s timeout / 50MB size).

## 4. Architectural Overview: The Validation Engine

### Phase 1: Static Validation (HTML/CSS)
*   **Execution:** Runs directly in Vercel Serverless Functions (Next.js API routes).
*   **Tooling:** Uses `cheerio` to parse submitted HTML strings.
*   **Process:** Evaluates DOM structure, semantic tags, and specific `id`/`data-testid` attributes securely and instantly.

### Phase 2: Dynamic Validation (Playwright E2E)
*   **Execution:** Offloaded to the Dedicated Free VPS (GCP/Oracle).
*   **Process:** 
    1. Student submits GitHub repo link or complex script via Vercel frontend.
    2. Vercel API saves submission to PostgreSQL with status `PENDING`.
    3. The VPS Worker (polling or via webhook) picks up the task, clones/pulls the code, and spawns a headless browser via Playwright.
    4. Worker runs the trainer's secret test suite against the student's code.
    5. Worker updates the PostgreSQL database with status `PASS`/`FAIL` and the detailed feedback JSON.
    6. Vercel frontend updates in real-time.

## 5. Database Schema (Prisma Blueprint - PostgreSQL)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Connection string from Neon.tech/Supabase
}

model User {
  id          String       @id @default(uuid())
  email       String       @unique
  name        String
  role        String       @default("STUDENT") // "STUDENT" | "TRAINER"
  submissions Submission[]
  createdAt   DateTime     @default(now())
}

model Assignment {
  id             String       @id @default(uuid())
  title          String
  description    String
  module         Int          // E.g., 1 (for HTML Basics), 8 (for CI/CD)
  validationType String       // "STATIC" (Cheerio) | "DYNAMIC" (Playwright)
  isActive       Boolean      @default(true)
  submissions    Submission[]
}

model Submission {
  id           String     @id @default(uuid())
  userId       String
  assignmentId String
  codePayload  String     // Raw HTML/JS or GitHub Repo URL
  status       String     // "PENDING" | "PASS" | "FAIL"
  score        Int        // Success percentage
  feedbackJSON String     // Detailed breakdown of passed/failed assertions
  submittedAt  DateTime   @default(now())

  user       User       @relation(fields: [userId], references: [id])
  assignment Assignment @relation(fields: [assignmentId], references: [id])
}
```

## 6. Strict Guardrails & Rules of Engagement

### 6.1 Security & Sandboxing (Zero Trust)
*   Never execute student-submitted JavaScript directly on the Vercel serverless environment or frontend.
*   Phase 2 Playwright executions must run in isolated browser contexts (Incognito) and ideally within a Docker container on the VPS to prevent malicious code from accessing the host OS.
*   Prevent XSS: Sanitize all outputs rendered on the Trainer Dashboard and Student 'Green Wall'.

### 6.2 Platform Limitations Compliance
*   **Vercel Serverless Limits:** Do not design synchronous API routes that take longer than 10 seconds to respond. For Phase 2, strictly use the asynchronous Worker pattern.
*   **cPanel Constraints:** Do not attempt to host Node.js instances or Headless Browsers on Hostico. Hostico is strictly for DNS routing (`qualiadept.eu`).

### 6.3 Development Workflow & Code Quality
*   **Research & Root-Cause First (Mandatory):** Whenever a task, question, bug, or feature is requested, always research deeply first, perform comprehensive root-cause analysis across all relevant layers, and discuss different viable solution options with trade-offs before modifying code.
*   **Iterative Delivery:** Always deliver specific, runnable chunks (e.g., "Here is the Prisma schema and the Next.js API route for submissions"). Wait for human approval before moving to the next chunk.
*   **SOLID & Clean Code:** The validation logic must serve as an educational example. Keep it modular and heavily commented.
*   **Feedback Standardization:** Always output validation feedback in the following JSON format:

```json
{
  "status": "fail",
  "score": 80,
  "feedback": [
    { "check": "Main tag exists", "passed": true, "message": "Expected id='add-task-btn'." }
  ]
}
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
