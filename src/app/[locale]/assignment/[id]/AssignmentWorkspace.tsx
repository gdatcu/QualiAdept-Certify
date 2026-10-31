'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex flex-col items-center justify-center gap-3 bg-zinc-950 text-zinc-400 font-mono text-xs border border-zinc-800 rounded-xl">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
      <span>Loading VS Code engine...</span>
    </div>
  ),
});

interface FeedbackItem {
  check: string;
  passed: boolean;
  message: string;
  file?: string;
}

interface ValidationResponse {
  status: 'pass' | 'fail';
  score: number;
  feedback: FeedbackItem[];
  isPartial?: boolean;
  targetFile?: string;
}

interface AssignmentData {
  id: string;
  title: string;
  description: string;
  module: number;
  validationType: string;
  passingSample?: string | null;
  failingSample?: string | null;
  validationRules?: string | null;
}

export interface SubmissionRecord {
  id: string;
  codePayload: string;
  status: string;
  score: number;
  feedbackJSON: string;
  submittedAt: string;
}

export interface AssignmentWorkspaceProps {
  assignment: AssignmentData;
  initialSubmissions?: SubmissionRecord[];
  previousPassedPayload?: string | null;
}

export interface ProjectFile {
  name: string;
  language: string;
  icon: string;
  badge?: string;
}

export function getModuleFiles(moduleNum: number, validationType: string): ProjectFile[] {
  if (validationType === 'DYNAMIC') {
    return [{ name: 'e2e.spec.ts', language: 'typescript', icon: '⚡' }];
  }
  if (moduleNum <= 1) {
    return [{ name: 'index.html', language: 'html', icon: '🌐' }];
  }
  if (moduleNum === 2) {
    return [
      { name: 'index.html', language: 'html', icon: '🌐' },
      { name: 'style.css', language: 'css', icon: '🎨' },
    ];
  }
  if (moduleNum === 7) {
    return [
      { name: 'index.html', language: 'html', icon: '🌐' },
      { name: 'style.css', language: 'css', icon: '🎨' },
      { name: 'app.ts', language: 'typescript', icon: '🔷' },
    ];
  }
  return [
    { name: 'index.html', language: 'html', icon: '🌐' },
    { name: 'style.css', language: 'css', icon: '🎨' },
    { name: 'app.js', language: 'javascript', icon: '📜' },
  ];
}

export interface CurriculumCriterion {
  file: string;
  title: string;
  title_en?: string;
  detail?: string;
  detail_en?: string;
}

export interface CurriculumModuleTask {
  businessTask: string;
  businessTask_en?: string;
  notes?: string;
  notes_en?: string;
  criteria: CurriculumCriterion[];
}

export const CURRICULUM_TASKS: Record<number, CurriculumModuleTask> = {
  0: {
    businessTask:
      'Modul de acomodare cu platforma QualiAdept. Testează editorul Monaco, verifică aserțiunile automate în timp real și trimite primul tău layout HTML pentru a te familiariza cu fluxul de validare înainte de începerea cursului.',
    businessTask_en:
      'Platform onboarding and sandbox module. Test the Monaco code editor, verify real-time automated assertions, and submit your first HTML layout to become familiar with the validation workflow before the live sessions start.',
    criteria: [
      {
        file: 'index.html',
        title: 'Tag-ul semantic <main>',
        title_en: 'Semantic <main> tag',
        detail: 'Documentul trebuie să includă elementul structural semantic <main>.',
        detail_en: 'Document must include the semantic structural <main> element.',
      },
      {
        file: 'index.html',
        title: 'Secțiune de practică cu id="practice-section"',
        title_en: 'Practice section with id="practice-section"',
        detail: 'Adaugă un container sau secțiune având atributul id="practice-section".',
        detail_en: 'Add a container or section having id="practice-section".',
      },
      {
        file: 'index.html',
        title: 'Buton submit cu data-testid="submit-btn"',
        title_en: 'Submit button with data-testid="submit-btn"',
        detail: 'Buton de acțiune având atributul data-testid="submit-btn".',
        detail_en: 'Action button with attribute data-testid="submit-btn".',
      },
    ],
  },
  1: {
    businessTask:
      'Construiește o pagină HTML de "Login și Înregistrare" pentru aplicația noastră Task Tracker, structurată conform bunelor practici și pregătită din start pentru a fi testată de roboții de automatizare.',
    businessTask_en:
      'Build a "Login and Registration" HTML page for our Task Tracker application, structured according to best practices and ready to be tested by automated Playwright robots.',
    criteria: [
      {
        file: 'index.html',
        title: 'Structură Boilerplate validă',
        title_en: 'Valid Boilerplate structure',
        detail: 'Documentul trebuie să aibă structura standard completă: <!DOCTYPE html>, <html>, <head> și <body>.',
        detail_en: 'Document must contain standard Boilerplate structure: <!DOCTYPE html>, <html>, <head>, and <body>.',
      },
      {
        file: 'index.html',
        title: 'Titlul paginii în browser (tag <title>)',
        title_en: 'Page title in browser tab (<title>)',
        detail: 'Titlul paginii în tab-ul browserului trebuie să fie: Task Tracker Login.',
        detail_en: 'Page title in browser tab must be: Task Tracker Login.',
      },
      {
        file: 'index.html',
        title: 'Container părinte <div class="login-container">',
        title_en: 'Parent container <div class="login-container">',
        detail: 'Formularul trebuie să aibă un container părinte având clasa "login-container".',
        detail_en: 'Form must be wrapped inside a parent container with class "login-container".',
      },
      {
        file: 'index.html',
        title: 'Formular de autentificare (<form>)',
        title_en: 'Authentication form (<form>)',
        detail: 'Include un element <form> care încapsulează câmpurile de login.',
        detail_en: 'Include a semantic <form> element encapsulating the login fields.',
      },
      {
        file: 'index.html',
        title: 'Câmp Email (id="login-email", data-testid="input-email")',
        title_en: 'Email input (id="login-email", data-testid="input-email")',
        detail: 'Un <input> pentru Email, având id="login-email" și data-testid="input-email".',
        detail_en: 'An <input> for Email with id="login-email" and data-testid="input-email".',
      },
      {
        file: 'index.html',
        title: 'Câmp Parolă (type="password", id="login-password", data-testid="input-password")',
        title_en: 'Password input (type="password", id="login-password", data-testid="input-password")',
        detail: 'Un <input> pentru Parolă (type="password"), având id="login-password" și data-testid="input-password".',
        detail_en: 'An <input> for Password with type="password", id="login-password" and data-testid="input-password".',
      },
      {
        file: 'index.html',
        title: 'Buton trimitere "Log In" (data-testid="btn-submit-login")',
        title_en: 'Submit button "Log In" (data-testid="btn-submit-login")',
        detail: 'Un <button> pentru trimitere, având textul "Log In" și atributul data-testid="btn-submit-login".',
        detail_en: 'A <button> to submit with text "Log In" and attribute data-testid="btn-submit-login".',
      },
    ],
  },
  2: {
    businessTask:
      'Transformă scheletul HTML simplu al "Task Tracker-ului" din Sesiunea 1 într-o aplicație structurată, pregătită atât vizual (cu un layout flexibil de bază), cât și tehnic (cu clase, id-uri și data-testid-uri) pentru prima noastră interacțiune cu Playwright.',
    businessTask_en:
      'Transform the simple HTML skeleton of the "Task Tracker" into a structured application, prepared visually (with a flexible base layout) and technically (with classes, IDs, and data-testid attributes) for our first Playwright interaction.',
    criteria: [
      {
        file: 'index.html',
        title: 'Conectare fișier CSS extern în <head>',
        title_en: 'Connect external CSS file in <head>',
        detail: 'Tag <link rel="stylesheet" href="style.css"> conectat în <head>.',
        detail_en: '<link rel="stylesheet" href="style.css"> tag correctly linked inside <head>.',
      },
      {
        file: 'index.html',
        title: 'Meniu Flexibil (Navbar)',
        title_en: 'Flexible menu (Navbar)',
        detail: 'În <header>, adaugă un <nav> care să aibă clasa "navbar".',
        detail_en: 'Inside <header>, add a <nav> element with class "navbar".',
      },
      {
        file: 'index.html',
        title: 'Element Logo în navbar',
        title_en: 'Logo element in navbar',
        detail: 'În interiorul acestui <nav>, include un element cu id-ul "logo".',
        detail_en: 'Inside <nav>, include an element with id="logo".',
      },
      {
        file: 'index.html',
        title: 'Buton de Login în navbar',
        title_en: 'Login button in navbar',
        detail: 'Un buton de login având atributul data-testid="btn-login".',
        detail_en: 'A login button inside <nav> having data-testid="btn-login".',
      },
      {
        file: 'index.html',
        title: 'Selector structural tabel (Rândul 3)',
        title_en: 'Table structural selector (Row 3)',
        detail: 'Al 3-lea rând din <tbody> (elementul <tr>) conține un buton de "Șterge" având clasa "delete-row".',
        detail_en: '3rd row in <tbody> (<tr> element) contains a Delete button with class "delete-row".',
      },
      {
        file: 'index.html',
        title: 'Buton cu Stare Dinamică (disabled)',
        title_en: 'Submit button with dynamic state (disabled)',
        detail: 'În formularul de adăugare task, butonul are data-testid="submit-task-btn" și atributul HTML disabled.',
        detail_en: 'In task creation form, button has data-testid="submit-task-btn" and native disabled HTML attribute.',
      },
      {
        file: 'style.css',
        title: 'Layout Flexbox pentru navbar',
        title_en: 'Flexbox layout for navbar',
        detail: 'Stilizare .navbar cu display: flex (și align-items / justify-content) pentru aliniere.',
        detail_en: '.navbar CSS rule with display: flex for proper alignment.',
      },
      {
        file: 'style.css',
        title: 'Selector pseudo-clasă structural tr:nth-child(3)',
        title_en: 'Structural pseudo-class selector tr:nth-child(3)',
        detail: 'Regulă CSS dedicată folosind pseudo-clasa :nth-child(3) pe rândurile tabelului.',
        detail_en: 'CSS rule using :nth-child(3) pseudo-class targeting table rows.',
      },
      {
        file: 'style.css',
        title: 'Stare interactivă :hover pentru butoane',
        title_en: ':hover interactive state for buttons',
        detail: 'Regulă CSS cu pseudo-clasa :hover definită pentru butoane.',
        detail_en: 'CSS rule with :hover pseudo-class defined for buttons.',
      },
      {
        file: 'style.css',
        title: 'Stare :disabled pentru butoane',
        title_en: ':disabled state for buttons',
        detail: 'Regulă CSS cu pseudo-clasa :disabled definită pentru butoanele dezactivate.',
        detail_en: 'CSS rule with :disabled pseudo-class defined for disabled buttons.',
      },
    ],
  },
  3: {
    businessTask:
      'Construiește prima parte din "creierul" aplicației (logica de bază în JavaScript). Scrie un script care stochează și procesează lista de task-uri, validând datele înainte de a fi afișate pe ecran.',
    businessTask_en:
      'Build the first part of the application\'s "brain" (core business logic in JavaScript). Write a script that stores and processes tasks, validating data before displaying it on screen.',
    notes:
      'Vei scrie acest cod fie în fișierul app.js (legat cu <script src="app.js"></script> la finalul <body>), fie direct în tab-ul Console din Chrome DevTools.',
    notes_en:
      'Write this code in app.js linked in index.html with <script src="app.js"></script> before the closing </body> tag.',
    criteria: [
      {
        file: 'index.html',
        title: 'Conectare fișier script app.js',
        title_en: 'Connect app.js script file',
        detail: 'Fișierul app.js este inclus în index.html folosind tag-ul <script src="app.js"></script>.',
        detail_en: 'Include app.js in index.html using <script src="app.js"></script>.',
      },
      {
        file: 'app.js',
        title: 'Structura Datelor E2E (Arrays & Objects)',
        title_en: 'Data structure: listaTaskuri array',
        detail: 'Declară o constantă numită listaTaskuri inițializată ca Array cu 2 obiecte ({ id, nume, completat }).',
        detail_en: 'Declare a constant named listaTaskuri initialized as an array of 2 task objects ({ id, nume, completat }).',
      },
      {
        file: 'app.js',
        title: 'Funcția Săgeată de Validare (Business Logic)',
        title_en: 'Validation Arrow Function proceseazaTaskNou',
        detail: 'Scrie o Arrow Function numită proceseazaTaskNou primind parametrul taskObj.',
        detail_en: 'Write arrow function proceseazaTaskNou accepting taskObj as parameter.',
      },
      {
        file: 'app.js',
        title: 'Validare strictă dacă numele lipsește sau e invalid',
        title_en: 'Strict validation if name is missing or invalid',
        detail: 'Verifică condițional (if/else) dacă numele task-ului lipsește ("") SAU este undefined.',
        detail_en: 'Check conditionally (if/else) whether task name is empty ("") or undefined.',
      },
      {
        file: 'app.js',
        title: 'Afișare mesaj de eroare în consolă',
        title_en: 'Console error message for invalid task',
        detail: 'Dacă datele sunt invalide, folosește console.log pentru a afișa: "Eroare: Task-ul trebuie să aibă un nume!".',
        detail_en: 'Log error message: "Eroare: Task-ul trebuie să aibă un nume!" via console.log.',
      },
      {
        file: 'app.js',
        title: 'Adăugare în Array prin push() și mesaj de succes',
        title_en: 'Add to collection via push() with success message',
        detail: 'Dacă datele sunt corecte, adaugă în listaTaskuri prin push() și afișează: "Task adăugat cu succes!".',
        detail_en: 'If valid, push taskObj to listaTaskuri and log "Task adăugat cu succes!".',
      },
      {
        file: 'app.js',
        title: 'Bucla de Raportare (Repetiția)',
        title_en: 'Reporting loop (for loop)',
        detail: 'Parcurge întregul Array listaTaskuri cu o buclă for și afișează în consolă doar numele fiecărui task.',
        detail_en: 'Loop through listaTaskuri with a for loop and console.log only the name of each task.',
      },
    ],
  },
  4: {
    businessTask:
      'Interceptează formularul de adăugare și injectează noile task-uri direct ca rânduri noi în tabelul HTML, fiecare venind la pachet cu propriul buton funcțional de ștergere.',
    businessTask_en:
      'Connect JavaScript to the DOM! Intercept the submission form and inject new tasks dynamically as table rows in HTML, each with its own functional delete button.',
    notes:
      'Testează de fiecare dată în browser dând refresh la pagina index.html, iar la final validează-ți munca în platformă!',
    notes_en:
      'Test in browser by refreshing index.html, then validate your work in the QualiAdept platform!',
    criteria: [
      {
        file: 'index.html',
        title: 'Conectarea fișierului app.js în index.html',
        title_en: 'Include app.js in index.html',
        detail: 'Asigură-te că fișierul app.js este inclus în index.html folosind tag-ul <script>.',
        detail_en: 'Ensure app.js is linked in index.html with <script> tag.',
      },
      {
        file: 'app.js',
        title: 'Selectarea Elementelor DOM',
        title_en: 'Select essential DOM elements',
        detail: 'Folosește document.querySelector(...) sau getElementById(...) pentru formular (#add-task-form), input (#task-name) și tabel (tbody).',
        detail_en: 'Use querySelector or getElementById for form (#add-task-form), input (#task-name), and table body (tbody).',
      },
      {
        file: 'app.js',
        title: 'Ascultător de Eveniment pe formular',
        title_en: 'Form submit event listener',
        detail: 'Adaugă un ascultător de eveniment pentru formular folosind addEventListener(\'submit\', ...).',
        detail_en: 'Attach submit event listener to form using addEventListener(\'submit\', ...).',
      },
      {
        file: 'app.js',
        title: 'Prevenirea Reîncărcării Paginii',
        title_en: 'Prevent default page reload',
        detail: 'În interiorul ascultătorului, apelează metoda e.preventDefault() pentru a opri reîncărcarea nativă.',
        detail_en: 'Call e.preventDefault() inside the event handler to stop native form submission.',
      },
      {
        file: 'app.js',
        title: 'Crearea Dinamică a elementului de rând',
        title_en: 'Dynamic creation of table row (<tr>)',
        detail: 'Extrage textul din input, apoi creează un rând nou folosind document.createElement(\'tr\').',
        detail_en: 'Extract text from input and create row using document.createElement(\'tr\').',
      },
      {
        file: 'app.js',
        title: 'Structura Rândului și Buton de Ștergere',
        title_en: 'Row structure with delete button',
        detail: 'Adaugă celulele (<td>), inclusiv butonul de ștergere având obligatoriu clasa "delete-row".',
        detail_en: 'Add cells (<td>), including delete button required to have class "delete-row".',
      },
      {
        file: 'app.js',
        title: 'Inserarea în DOM',
        title_en: 'Insert row into table body',
        detail: 'Adaugă noul rând în corpul tabelului folosind metoda .appendChild(...) sau .append(...).',
        detail_en: 'Append new row into table body using .appendChild(...) or .append(...).',
      },
      {
        file: 'app.js',
        title: 'Curățarea Inputului',
        title_en: 'Reset input field',
        detail: 'Resetează valoarea câmpului de input la un string gol (input.value = \'\') după salvarea task-ului.',
        detail_en: 'Clear text input value (input.value = \'\') after saving task.',
      },
      {
        file: 'app.js',
        title: 'Ștergerea Dinamică din DOM',
        title_en: 'Dynamic removal from DOM on click',
        detail: 'Implementează logica de ștergere la apăsarea butonului folosind metoda .remove() pe rândul părinte (<tr>).',
        detail_en: 'Implement delete handler calling .remove() on parent <tr> when delete button is clicked.',
      },
    ],
  },
  5: {
    businessTask:
      'La încărcarea paginii, descarcă automat 5 task-uri de la un API public extern și desenează-le pe ecran în containerul listă!',
    businessTask_en:
      'Fetch tasks from an external API using asynchronous JavaScript! On page load, automatically download 5 test tasks from a public server and render them dynamically in the interface list.',
    notes:
      'Vei adăuga acest cod în fișierul app.js existent. Endpoint public: https://jsonplaceholder.typicode.com/todos?_limit=5.',
    notes_en:
      'Add this code in your existing app.js file. Public endpoint: https://jsonplaceholder.typicode.com/todos?_limit=5.',
    criteria: [
      {
        file: 'index.html',
        title: 'Containerul listă în DOM (#active-tasks-list)',
        title_en: 'List container in DOM (#active-tasks-list)',
        detail: 'În index.html trebuie să ai un element (ex: <ul> sau <div>) cu id-ul "active-tasks-list".',
        detail_en: 'index.html must have a container element (e.g. <ul> or <div>) with id="active-tasks-list".',
      },
      {
        file: 'app.js',
        title: 'Crearea funcției asincrone incarcaTaskuriInitiale',
        title_en: 'Declare async function incarcaTaskuriInitiale',
        detail: 'Declară o Arrow Function asincronă numită const incarcaTaskuriInitiale = async () => { ... }.',
        detail_en: 'Declare an async arrow function: const incarcaTaskuriInitiale = async () => { ... }.',
      },
      {
        file: 'app.js',
        title: 'Fetch API GET request',
        title_en: 'Fetch API GET request',
        detail: 'Folosește await fetch(\'https://jsonplaceholder.typicode.com/todos?_limit=5\') pentru cererea HTTP.',
        detail_en: 'Call await fetch(\'https://jsonplaceholder.typicode.com/todos?_limit=5\') inside the function.',
      },
      {
        file: 'app.js',
        title: 'Conversia răspunsului cu await .json()',
        title_en: 'Unpack response with await .json()',
        detail: 'Despachetează răspunsul primit folosind await raspuns.json() obținând un Array cu 5 Obiecte.',
        detail_en: 'Convert HTTP response into an array of 5 objects using await response.json().',
      },
      {
        file: 'app.js',
        title: 'Selectare container din DOM',
        title_en: 'Select DOM container element',
        detail: 'Găsește lista principală din HTML (#active-tasks-list) pentru populare.',
        detail_en: 'Select #active-tasks-list in DOM for inserting fetched tasks.',
      },
      {
        file: 'app.js',
        title: 'Iterare prin lista de task-uri',
        title_en: 'Iterate over fetched tasks',
        detail: 'Folosește o buclă for (sau .forEach()) pentru a parcurge Array-ul primit de la server.',
        detail_en: 'Use forEach or for..of loop to iterate over the array of 5 tasks.',
      },
      {
        file: 'app.js',
        title: 'Creare dinamică a elementelor <li>',
        title_en: 'Dynamically create <li> elements',
        detail: 'Pentru fiecare obiect din listă, creează dinamic un element cu document.createElement(\'li\').',
        detail_en: 'For each task in list, create element using document.createElement(\'li\').',
      },
      {
        file: 'app.js',
        title: 'Setare titlu din proprietatea .title',
        title_en: 'Set text from .title property',
        detail: 'Setează textul elementului <li> cu proprietatea .title a obiectului JSON primit de pe rețea.',
        detail_en: 'Set <li> text content using task.title from the JSON object.',
      },
      {
        file: 'app.js',
        title: 'Injectare în listă cu appendChild()',
        title_en: 'Append elements to list with appendChild()',
        detail: 'Injectează fiecare element <li> în containerul #active-tasks-list folosind appendChild().',
        detail_en: 'Append each created <li> element into #active-tasks-list.',
      },
      {
        file: 'app.js',
        title: 'Apelarea automată a funcției la pornire',
        title_en: 'Auto-invoke function on page load',
        detail: 'Scrie incarcaTaskuriInitiale(); la finalul fișierului app.js pentru declanșare imediată.',
        detail_en: 'Call incarcaTaskuriInitiale(); at bottom of app.js to trigger loading immediately.',
      },
    ],
  },
  6: {
    businessTask:
      'Livrarea Proiectului "Task Tracker" (Capstone): Ești la finalul sprintului de dezvoltare. Asamblează aplicația completă, adaugă funcționalitatea de Marcare ca Finalizat (line-through) și efectuează auditul strict de testabilitate QA pentru pregătirea testelor Playwright!',
    businessTask_en:
      'Delivery of the "Task Tracker" Project (Capstone): Assemble the complete application, implement the Mark as Completed feature (line-through), and run the strict QA testability audit to prepare for automated Playwright tests!',
    notes:
      'Asigură-te că toate cele 3 fișiere (index.html, style.css, app.js) sunt active și integrate!',
    notes_en:
      'Ensure all 3 files (index.html, style.css, app.js) are active and integrated!',
    criteria: [
      {
        file: 'index.html',
        title: 'Câmpul de text cu data-testid="input-task-name"',
        title_en: 'Text input with data-testid="input-task-name"',
        detail: 'Câmpul de input pentru task conține atributul data-testid="input-task-name".',
        detail_en: 'Task name input field must have attribute data-testid="input-task-name".',
      },
      {
        file: 'index.html',
        title: 'Buton salvare dezactivat inițial cu data-testid="submit-task-btn"',
        title_en: 'Save button initially disabled with data-testid="submit-task-btn"',
        detail: 'Butonul de salvare are data-testid="submit-task-btn" și atributul HTML disabled setat nativ.',
        detail_en: 'Submit button has data-testid="submit-task-btn" and disabled HTML attribute set natively.',
      },
      {
        file: 'index.html',
        title: 'Mesaj de eroare cu data-testid="error-message"',
        title_en: 'Error message element with data-testid="error-message"',
        detail: 'Element dedicat mesajelor de eroare având atributul data-testid="error-message".',
        detail_en: 'Dedicated error message element with data-testid="error-message".',
      },
      {
        file: 'index.html',
        title: 'Containerul listă cu data-testid="task-list"',
        title_en: 'List container with data-testid="task-list"',
        detail: 'Lista <ul> principală are atributul data-testid="task-list".',
        detail_en: 'Main <ul> list container has data-testid="task-list".',
      },
      {
        file: 'style.css',
        title: 'Stilizare task finalizat (.completed)',
        title_en: 'Completed task styling (.completed)',
        detail: 'Regulă CSS .completed { text-decoration: line-through; color: gray; } pentru marcarea vizuală.',
        detail_en: 'CSS rule .completed { text-decoration: line-through; color: gray; } for visual completion marking.',
      },
      {
        file: 'app.js',
        title: 'Task 1: Integrarea completă a codului (GET inițial)',
        title_en: 'Task 1: Complete integration (initial GET)',
        detail: 'Aplicația aduce cele 5 task-uri inițiale de la server la încărcare și ascunde spinnerul.',
        detail_en: 'App fetches initial 5 tasks from server on load and hides loading spinner.',
      },
      {
        file: 'app.js',
        title: 'Task 1: Salvare task nou pe rețea (POST fetch)',
        title_en: 'Task 1: Save task to network (POST fetch)',
        detail: 'Trimiterea formularului adaugă task-ul printr-o cerere POST către server.',
        detail_en: 'Form submit sends POST request to server to persist new task.',
      },
      {
        file: 'app.js',
        title: 'Task 2: Marcare ca Finalizat (.completed la click)',
        title_en: 'Task 2: Mark as Completed (.completed on click)',
        detail: 'La click pe elementul .task-title, activează/dezactivează clasa cu e.target.classList.toggle(\'completed\').',
        detail_en: 'Clicking on .task-title toggles completed class via e.target.classList.toggle(\'completed\').',
      },
      {
        file: 'app.js',
        title: 'Task 3: Buton de ștergere dinamic cu data-testid="delete-btn-ID"',
        title_en: 'Task 3: Dynamic delete button with data-testid="delete-btn-ID"',
        detail: 'Fiecare buton de ștergere generat dinamic conține atributul data-testid="delete-btn-ID".',
        detail_en: 'Each dynamically generated delete button contains data-testid="delete-btn-ID".',
      },
      {
        file: 'app.js',
        title: 'Task 3: Ștergere pe rețea (DELETE fetch) și eliminare din DOM',
        title_en: 'Task 3: Network deletion (DELETE fetch) and remove from DOM',
        detail: 'La ștergere, trimite cererea DELETE pe rețea și elimină rândul din DOM cu .remove().',
        detail_en: 'Clicking delete sends DELETE request to server and removes row via .remove().',
      },
      {
        file: 'app.js',
        title: 'Chaos Mode: Pop-up promoțional cu data-testid="close-promo-btn"',
        title_en: 'Chaos Mode: Promotional pop-up with data-testid="close-promo-btn"',
        detail: 'Pop-up-ul din Chaos Mode conține un buton de închidere cu data-testid="close-promo-btn".',
        detail_en: 'Chaos mode promotional pop-up has close button with data-testid="close-promo-btn".',
      },
      {
        file: 'app.js',
        title: 'Bonus Senior: Prevenire task-uri duplicate',
        title_en: 'Senior Bonus: Prevent duplicate tasks',
        detail: 'Blochează trimiterea unui task dacă textul există deja în lista afișată.',
        detail_en: 'Prevent adding a task if identical text already exists in current task list.',
      },
    ],
  },
  7: {
    businessTask:
      'Refactorizarea aplicației "Task Tracker" prin adăugarea primului strat de tipizare statică TypeScript. Înaintea începerii scrierii testelor automate de Playwright din Sesiunea 9, Lead Architect-ul și echipa de QA au decis migrarea codebase-ului către TypeScript pentru a garanta stabilitatea Enterprise. Sarcina ta este să transformi scriptul de logică într-un modul TypeScript securizat (app.ts), introducând tipuri explicite pentru toate datele manipulate și respectând politica Zero Any.',
    businessTask_en:
      'Refactor the "Task Tracker" application with static TypeScript typing. Before writing automated Playwright tests in Session 9, the Lead Architect and QA team decided to migrate the codebase to TypeScript for Enterprise stability. Your task is to turn the script into a secured TypeScript module (app.ts), introducing explicit types for all data and enforcing the Zero Any policy.',
    notes:
      'Vei scrie codul în fișierul app.ts (care preia și extinde logica din fostul app.js). În index.html, acesta va fi conectat prin <script src="app.ts"></script> (platforma compilează automat TypeScript pentru execuția Live Preview!).',
    notes_en:
      'You will write the code in app.ts (which extends the previous app.js logic). In index.html, link it via <script src="app.ts"></script> (the platform automatically transpiles TypeScript for Live Preview!).',
    criteria: [
      {
        file: 'index.html',
        title: 'Conectare script app.ts',
        title_en: 'Connect script app.ts',
        detail: 'Fișierul app.ts este conectat în index.html prin <script src="app.ts"></script>.',
        detail_en: 'File app.ts is linked in index.html via <script src="app.ts"></script>.',
      },
      {
        file: 'app.ts',
        title: 'Tipizare primitivă apiUrl: string',
        title_en: 'Primitive typing apiUrl: string',
        detail: 'Variabila apiUrl conține adnotarea explicită : string.',
        detail_en: 'Variable apiUrl includes explicit : string annotation.',
      },
      {
        file: 'app.ts',
        title: 'Tipizare primitivă maxTasksLimit: number',
        title_en: 'Primitive typing maxTasksLimit: number',
        detail: 'Variabila maxTasksLimit conține adnotarea explicită : number.',
        detail_en: 'Variable maxTasksLimit includes explicit : number annotation.',
      },
      {
        file: 'app.ts',
        title: 'Tipizare primitivă isAppReady: boolean',
        title_en: 'Primitive typing isAppReady: boolean',
        detail: 'Variabila isAppReady conține adnotarea explicită : boolean.',
        detail_en: 'Variable isAppReady includes explicit : boolean annotation.',
      },
      {
        file: 'app.ts',
        title: 'Union Type TaskStatus',
        title_en: 'Union Type TaskStatus',
        detail: 'Type Alias TaskStatus acceptă strict \'todo\' | \'in-progress\' | \'completed\'.',
        detail_en: 'Type Alias TaskStatus strictly allows \'todo\' | \'in-progress\' | \'completed\'.',
      },
      {
        file: 'app.ts',
        title: 'Model de date tipizat TaskItem',
        title_en: 'Typed data model TaskItem',
        detail: 'Type Alias TaskItem descrie proprietățile id, title, status, completed și opțional priority?.',
        detail_en: 'Type Alias TaskItem specifies id, title, status, completed and optional priority?.',
      },
      {
        file: 'app.ts',
        title: 'Colecție tipizată listaTaskuri: TaskItem[]',
        title_en: 'Typed collection listaTaskuri: TaskItem[]',
        detail: 'Array-ul principal listaTaskuri este declarat explicit ca TaskItem[] (sau Array<TaskItem>).',
        detail_en: 'Main array listaTaskuri is explicitly declared as TaskItem[] (or Array<TaskItem>).',
      },
      {
        file: 'app.ts',
        title: 'Semnătură funcție proceseazaTaskNou',
        title_en: 'Function signature proceseazaTaskNou',
        detail: 'Funcția proceseazaTaskNou primește (taskObj: TaskItem) și returnează explicit : boolean.',
        detail_en: 'Function proceseazaTaskNou accepts (taskObj: TaskItem) and returns explicit : boolean.',
      },
      {
        file: 'app.ts',
        title: 'Semnătură funcție afiseazaTask',
        title_en: 'Function signature afiseazaTask',
        detail: 'Funcția afiseazaTask primește (id: number) și returnează explicit : void.',
        detail_en: 'Function afiseazaTask accepts (id: number) and returns explicit : void.',
      },
      {
        file: 'app.ts',
        title: 'Funcție asincronă & Type Assertion',
        title_en: 'Async function & Type Assertion',
        detail: 'Funcția asincronă returnează : Promise<void> și asertează răspunsul cu as TaskItem[].',
        detail_en: 'Async function returns : Promise<void> and asserts server data with as TaskItem[].',
      },
      {
        file: 'app.ts',
        title: 'Zero Any Policy (fără tipul any)',
        title_en: 'Zero Any Policy (no any type)',
        detail: 'Regulă strictă QA: Este strict interzisă utilizarea lui any. Toate aparițiile lui any vor fi penalizate.',
        detail_en: 'Strict QA rule: any type is forbidden. Any occurrence of any will fail validation.',
      },
    ],
  },
};

export function getAssignmentCurriculumTask(
  assignment: AssignmentData,
  locale: string = 'ro'
): {
  businessTask: string;
  notes?: string;
  criteria: Array<{ file: string; title: string; detail?: string }>;
} {
  const isEn = locale === 'en';
  const predefined = CURRICULUM_TASKS[assignment.module];
  if (predefined) {
    return {
      businessTask: (isEn && predefined.businessTask_en) ? predefined.businessTask_en : predefined.businessTask,
      notes: (isEn && predefined.notes_en) ? predefined.notes_en : predefined.notes,
      criteria: predefined.criteria.map((c) => ({
        file: c.file,
        title: (isEn && c.title_en) ? c.title_en : c.title,
        detail: (isEn && c.detail_en) ? c.detail_en : c.detail,
      })),
    };
  }

  // Fallback: parse assignment.validationRules if available
  let parsedCriteria: CurriculumCriterion[] = [];
  if (assignment.validationRules) {
    try {
      const rules = JSON.parse(assignment.validationRules);
      if (Array.isArray(rules)) {
        parsedCriteria = rules.map((r: Record<string, string | undefined>) => {
          const file = r.file || (r.target === 'css' ? 'style.css' : r.target === 'js' ? 'app.js' : 'index.html');
          const title = (isEn && r.name_en)
            ? r.name_en
            : (r.name || r.title || r.message || r.selector || 'Assertion Check');
          const detail = (isEn && r.message_en)
            ? r.message_en
            : (r.message || (r.selector ? `Selector: ${r.selector}` : undefined));
          return { file, title, detail };
        });
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  if (parsedCriteria.length === 0) {
    parsedCriteria = [
      {
        file: 'index.html',
        title: isEn ? 'Module implementation requirements' : 'Implementare conform cerințelor modulului',
        detail: isEn
          ? 'Write the required code in the editor and click Submit for automated evaluation.'
          : 'Scrie codul corespunzător în editor și apasă Submit pentru evaluare automată.',
      },
    ];
  }

  return {
    businessTask: assignment.description,
    criteria: parsedCriteria,
  };
}

export const getWorkspaceTranslations = (locale: string) => {
  const isRo = locale === 'ro';
  return {
    staticValidation: isRo ? 'Validare Statică' : 'STATIC Validation',
    dynamicValidation: isRo ? 'Validare Dinamică' : 'DYNAMIC Validation',
    moduleCompleted: isRo ? 'Modul Finalizat' : 'Module Completed',
    submissions: isRo ? 'Trimiteri' : 'Submissions',
    attempts: isRo ? 'Încercări' : 'Attempts',
    role: isRo ? 'Rol' : 'Role',
    guest: isRo ? 'Vizitator' : 'Guest',
    assignmentPassed: isRo ? 'Modul Promovat!' : 'Assignment Passed!',
    assignmentPassedDesc: isRo
      ? 'Editorul este blocat pentru a preveni modificările accidentale. Apasă "Editează / Retrimite Codul" pentru a-ți actualiza soluția.'
      : 'The editor is read-only to prevent accidental overwrites. Click "Edit / Resubmit" to modify your solution.',
    editResubmit: isRo ? 'Editează / Retrimite Codul' : 'Edit / Resubmit Code',
    checkFile: (file: string) => (isRo ? `Verifică ${file}` : `Check ${file}`),
    resetCode: isRo ? 'Resetează Codul' : '{wt.resetCode}',
    livePreview: isRo ? 'Previzualizare Live' : '{wt.livePreview}',
    editing: (file: string) => (isRo ? `Editare: ${file}` : `Editing: ${file}`),
    projectFiles: (count: number) => (isRo ? `${count} fișiere în proiect` : `${count} project files`),
    lines: (count: number) => (isRo ? `${count} linii` : `${count} lines`),
    submitProject: isRo ? 'Trimite Proiectul spre Validare' : 'Submit Project for Validation',
    submitCode: isRo ? 'Trimite Codul' : 'Submit Code',
    syncToGitHub: isRo ? 'Sincronizează pe GitHub' : 'Sync to GitHub',
    unlockEditor: isRo ? 'Deblochează Editorul' : 'Unlock Editor',
    activeFooter: (file: string, count: number) =>
      isRo ? `Activ: ${file}  Total Fișiere: ${count}` : `Active: ${file}  Total Files: ${count}`,
    submissionHistory: isRo ? 'Istoric Trimiteri' : '{wt.submissionHistory}',
    gitHistoryDesc: isRo ? 'Istoricul trimiterilor pentru acest modul' : '{wt.gitHistoryDesc}',
    noSubmissions: isRo ? 'Nicio trimitere înregistrată încă pentru acest modul.' : '{wt.noSubmissions}',
    activeCode: isRo ? 'Cod Activ' : 'Active Code',
    viewCode: isRo ? 'Vizualizează Cod' : 'View Code',
    greenWallTitle: isRo ? 'Panou Evaluare & Criterii' : 'Green Wall Feedback',
    domAssertions: isRo ? 'Aserțiuni automate DOM & JS' : 'Automated DOM Assertions',
    playwrightEngine: isRo ? 'Analiză motor Playwright' : 'Playwright Engine Analysis',
    tabCriteria: isRo ? 'Cerințe & Ghid' : 'Requirements & Guide',
    tabResults: isRo ? 'Rezultate Validare' : 'Validation Results',
    guideHeader: isRo ? 'Ghid de Rezolvare & Criterii de Validare' : 'Implementation Guide & Validation Criteria',
    guideSubhead: isRo
      ? 'Implementează cerințele de mai jos, apoi apasă Submit pentru validare automată.'
      : 'Implement the requirements below, then click Submit for automated validation.',
    businessTask: isRo ? 'Sarcina ta de Business' : 'Your Business Task',
    note: isRo ? 'Notă:' : 'Note:',
    technicalCriteria: isRo ? 'Cerințe Tehnice (Acceptance Criteria)' : 'Technical Acceptance Criteria',
    requirementsCount: (count: number) => (isRo ? `${count} cerințe` : `${count} requirements`),
    bottomTip: isRo
      ? 'Verifică codul fiecărui fișier cu butonul "Check [fișier]" din editor, sau apasă butonul mare de jos când proiectul este gata.'
      : 'Test individual files using the "Check [file]" button in the editor, or click the bottom submit button when your project is ready.',
    statusPass: isRo ? 'STATUS: TRECUT' : 'STATUS: PASS',
    statusFail: isRo ? 'STATUS: PICAT' : 'STATUS: FAIL',
    allChecksPassed: isRo ? 'Toate Aserțiunile au Trecut!' : '{wt.allChecksPassed}',
    validationFailed: isRo ? 'Validare Eșuată' : '{wt.validationFailed}',
    score: isRo ? 'Scor' : 'Score',
    modulePassedCongrats: isRo ? '🎉 Modul Promovat!' : '{wt.modulePassedCongrats}',
    modulePassedDesc: isRo
      ? 'Următorul modul din programă este acum deblocat în Dashboard.'
      : '{wt.modulePassedDesc}',
    dashboardBtn: isRo ? 'Către {wt.dashboardBtn}' : 'Dashboard →',
    assertionResults: isRo ? 'REZULTATE ASERȚIUNI' : 'ASSERTION RESULTS',
    evaluatedAcross: (count: number) =>
      isRo ? `Evaluate pe ${count} ${count === 1 ? 'fișier' : 'fișiere'}` : `Evaluated across ${count} ${count === 1 ? 'file' : 'files'}`,
    noResultsYetTitle: isRo ? 'Niciun rezultat încă' : 'No validation results yet',
    noResultsYetDesc: isRo
      ? 'Scrie codul în editorul din stânga și apasă "Trimite Proiectul spre Validare" pentru a rula testele.'
      : 'Write code in the left editor and click "Submit Project for Validation" to run tests.',
    switchToCriteriaBtn: isRo ? 'Vezi Cerințele Modulului →' : 'View Module Requirements →',
  };
};

// ==========================================
// 1. STARTER TEMPLATES (Challenge Scaffolds)
// ==========================================

const STARTER_HTML_S1 = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Task Tracker</title>
</head>
<body>
  <header>
    <!-- Cerința: Creează bara de navigație cu tag-uri semantice și test-id -->
    <nav>
      <h1>Task Tracker</h1>
      <button data-testid="btn-login">Log In</button>
    </nav>
  </header>

  <main>
    <section id="add-task-section">
      <!-- Cerința: Adaugă formularul de adăugare task -->
      <form>
        <input type="text" id="task-input" placeholder="Nume Task">
        <button type="submit" data-testid="submit-btn">Adaugă Task</button>
      </form>
    </section>
  </main>
</body>
</html>`;

const STARTER_HTML_S2 = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Task Tracker</title>
  <!-- Cerința 1: Conectează fișierul extern style.css aici -->
</head>
<body>
  <header>
    <!-- Cerința 2: Navbar flexibil cu clasa navbar, id logo și data-testid btn-login -->
    <nav>
      <div>Task Tracker</div>
      <button data-testid="btn-login">Log In</button>
    </nav>
  </header>

  <main>
    <div class="login-container">
      <form>
        <input type="email" id="login-email" data-testid="input-email" placeholder="Email">
        <input type="password" id="login-password" data-testid="input-password" placeholder="Parolă">
        <button data-testid="btn-submit-login">Log In</button>
      </form>
    </div>

    <section class="task-input-section">
      <form id="add-task-form">
        <input type="text" id="task-name" placeholder="Nume Task">
        <!-- Cerința 4: Adaugă atributul disabled pentru butonul de salvare -->
        <button type="submit" data-testid="submit-task-btn">Salvează Task</button>
      </form>
    </section>

    <section class="task-history-section">
      <table id="history-table">
        <tbody>
          <tr>
            <td>#1001</td>
            <td>Task 1</td>
          </tr>
          <tr>
            <td>#1002</td>
            <td>Task 2</td>
          </tr>
          <!-- Cerința 3: Adaugă al 3-lea rând cu clasa delete-row pe butonul de ștergere -->
          <tr>
            <td>#1003</td>
            <td>
              <button>Șterge</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>`;

const STARTER_CSS_S2 = `/* ============================================================
 * Sesiunea 2: CSS & DOM Selectors
 * ============================================================
 * Completează fișierul cu regulile CSS conform cerințelor:
 * 1. Meniu Flexibil: Stilizare pentru clasa .navbar (Flexbox) și #logo
 * 2. Stări Dinamice: Selectori pentru :hover (butoane active) și :disabled (butoane inactive)
 * 3. Selectori Structurali: Stilizare pentru al 3-lea rând (tr:nth-child(3)) și .delete-row
 * ============================================================ */

/* Scrie regulile CSS aici: */
`;

const STARTER_JS_S3 = `// ============================================================
// Sesiunea 3: JavaScript Basics (Business Logic & Validare)
// ============================================================
// Cerințe Tehnice (Acceptance Criteria):
// 1. Array de Obiecte: Declară constanta listaTaskuri cu cele 2 task-uri inițiale (id, nume, completat).
// 2. Funcție Săgeată (Arrow Function): proceseazaTaskNou(taskObj) cu validare strictă if/else.
//    - Dacă numele lipsește ("") sau este undefined: afișează mesaj de eroare în consolă.
//    - Dacă datele sunt valide: adaugă noul task în array (push) și afișează mesaj de succes.
// 3. Buclă de Raportare: Parcurge listaTaskuri cu o buclă for și afișează numele fiecărui task.
// ============================================================

// 1. Baza temporară de date (Array de Obiecte)


// 2. Funcția de Validare (Arrow Function)


// 3. Testează funcția apelând-o cu un task invalid și unul valid


// 4. Bucla for pentru raportarea task-urilor din memorie

`;

const STARTER_JS_S4 = `// ============================================================
// Sesiunea 4: JS DOM Manipulation (Task Tracker)
// ============================================================
// Cerințe Tehnice:
// 1. Selectare elemente DOM: formular (#add-task-form), input (#task-name), tbody.
// 2. Ascultător de eveniment 'submit' pe formular cu preventDefault().
// 3. Creare dinamică rând nou (document.createElement('tr')).
// 4. Structura rândului: celule <td> cu numele task-ului și buton cu clasa 'delete-row'.
// 5. Inserare în DOM folosind appendChild() sau append().
// 6. Resetare valoare câmp input (input.value = '').
// 7. Ștergere dinamică din DOM cu .remove() la click pe butonul 'delete-row'.
// ============================================================

// 1. Selectare elemente DOM


// 2. Ascultător eveniment 'submit' și adăugare dinamică în tabel


// 3. Ștergere dinamică din DOM (Event Delegation pe document sau click pe buton)

`;

const STARTER_JS_S5 = `// ============================================================
// Sesiunea 5: JS Asincron (Fetch API & Task-uri Active)
// ============================================================
// Cerințe Tehnice:
// 1. Declară o Arrow Function asincronă:
//    const incarcaTaskuriInitiale = async () => { ... };
// 2. În interiorul funcției, apelează:
//    const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
// 3. Despachetează răspunsul: const taskuri = await response.json();
// 4. Selectează lista din HTML: const activeTasksList = document.querySelector('#active-tasks-list');
// 5. Iterează prin taskuri (cu forEach sau for):
//    - Creează dinamic un element <li> (document.createElement('li')).
//    - Setează textul cu titlul task-ului (li.textContent = task.title).
//    - Adaugă elementul în listă (activeTasksList.appendChild(li)).
// 6. Apelează funcția la finalul fișierului: incarcaTaskuriInitiale();
// ============================================================

// Adaugă aici funcția asincronă incarcaTaskuriInitiale și apelarea ei:

`;

const STARTER_HTML_S3 = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Task Tracker</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <nav class="navbar">
      <h1 id="logo">Task Tracker</h1>
      <button data-testid="btn-login">Log In</button>
    </nav>
  </header>

  <main>
    <div class="login-container">
      <form>
        <input type="email" id="login-email" data-testid="input-email" placeholder="Email">
        <input type="password" id="login-password" data-testid="input-password" placeholder="Parolă">
        <button data-testid="btn-submit-login">Log In</button>
      </form>
    </div>

    <section class="task-input-section">
      <form id="add-task-form">
        <input type="text" id="task-name" placeholder="Nume Task">
        <button type="submit" data-testid="submit-task-btn" disabled>Salvează Task</button>
      </form>
    </section>

    <section class="task-history-section">
      <table id="history-table">
        <tbody>
          <tr>
            <td>#1001</td>
            <td>Task 1</td>
          </tr>
          <tr>
            <td>#1002</td>
            <td>Task 2</td>
          </tr>
          <tr>
            <td>#1003</td>
            <td>
              <button class="delete-row">Șterge</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>`;

const STARTER_CSS_S3 = `/* ============================================================
 * Task Tracker - Stiluri CSS validate (Sesiunea 2)
 * ============================================================ */

/* 1. Meniu Flexibil (Flexbox) */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #18181b;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #27272a;
}

#logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
}

/* 2. Selectori Structurali */
tr:nth-child(3) {
  background-color: #27272a;
  font-weight: 600;
}

.delete-row {
  color: #f43f5e;
  border: 1px solid #e11d48;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: transparent;
}

/* 3. Stări Dinamice */
button:not(:disabled):hover {
  background-color: #059669;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

const STARTER_HTML_S6 = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QA Task Tracker Pro</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Antetul Aplicației -->
  <header class="navbar">
    <h1 id="logo">QA Task Tracker</h1>
    <div class="user-controls">
      <span id="network-status" class="status-indicator online">API Online</span>
    </div>
  </header>

  <!-- Containerul principal -->
  <main class="container">
    <!-- Secțiunea de adăugare task -->
    <section class="card input-section">
      <h2>Adaugă un Scenariu Nou</h2>
      <form id="add-task-form">
        <div class="input-group">
          <!-- TODO Task 3 (Auditul QA): Adaugă atributul de test pe input: input-task-name -->
          <input type="text" id="task-name" placeholder="ex: Testare validare login...">
          <!-- TODO Task 3 (Auditul QA): Adaugă atributul submit-task-btn și dezactivează butonul nativ (disabled) -->
          <button type="submit" id="submit-task-btn">Salvează</button>
        </div>
        <!-- TODO Task 3 (Auditul QA): Adaugă atributul error-message -->
        <small id="error-msg" class="error-text" style="display: none;">Numele task-ului nu poate fi gol!</small>
      </form>
    </section>

    <!-- Secțiunea de listare task-uri -->
    <section class="card list-section">
      <h2>Scenarii de Testare (Live)</h2>
      <!-- Element vizual pentru latență asincronă -->
      <div id="loading-spinner" class="spinner">Se încarcă datele de la server...</div>
      <!-- TODO Task 3 (Auditul QA): Adaugă atributul task-list pe elementul <ul> -->
      <ul id="task-list" class="task-list">
        <!-- Rândurile (<li>) vor fi injectate dinamic de JavaScript -->
      </ul>
    </section>
  </main>

  <script src="app.js"></script>
</body>
</html>`;

const STARTER_CSS_S6 = `/* ============================================================
 * Task Tracker Pro - Stiluri Capstone (Sesiunea 6)
 * ============================================================ */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
  background-color: #f4f6f8;
  color: #333;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

#logo {
  font-size: 1.5rem;
  font-weight: bold;
}

.status-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
}

.status-indicator.online {
  background-color: #2ecc71;
  color: white;
}

.container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.card h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.input-group {
  display: flex;
  gap: 10px;
}

#task-name {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #2980b9;
}

button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.6;
}

.error-text {
  color: #e74c3c;
  margin-top: 0.5rem;
  display: block;
}

.spinner {
  padding: 1rem;
  background-color: #fcf3cf;
  color: #7d6608;
  border-radius: 4px;
  text-align: center;
  margin-bottom: 1rem;
  font-weight: bold;
}

.task-list {
  list-style: none;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.task-item:hover {
  background-color: #f9f9f9;
}

.task-title {
  cursor: pointer;
}

.btn-delete {
  background-color: #e74c3c;
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-delete:hover:not(:disabled) {
  background-color: #c0392b;
}

/* ============================================================
 * Cerința Task 2: Stil pentru Task-uri Finalizate (.completed)
 * Adaugă stilul pentru clasa .completed cu tăierea textului (efect line-through)
 * ============================================================ */
/* TODO Task 2: Scrie regula pentru clasa de finalizare aici */

/* ============================================================
 * Modul Chaos: Overlay & Pop-up Promoțional
 * ============================================================ */
.overlay-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(3px);
}

.promo-box {
  background: white;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  max-width: 400px;
}

.promo-box h3 {
  color: #e74c3c;
  margin-bottom: 15px;
  font-size: 22px;
}

.promo-box p {
  margin-bottom: 20px;
  font-size: 15px;
}

.btn-close-promo {
  background-color: #2c3e50;
  color: white;
  width: 100%;
}

.btn-close-promo:hover:not(:disabled) {
  background-color: #1a252f;
}
`;

const STARTER_JS_S6 = `// ============================================================
// Sesiunea 6: Livrarea Proiectului "Task Tracker" (Capstone)
// ============================================================
// Cerințe Tehnice (Acceptance Criteria):
// Task 1: Integrarea completă a codului (GET 5 task-uri & ascunde spinner, POST la salvare, DELETE la ștergere, Modul Chaos)
// Task 2: Funcționalitatea Nouă (Marcare ca Finalizat la click pe .task-title prin toggle pe clasa 'completed')
// Task 3: Auditul de Testabilitate (Verifică atributele data-testid pe input, submit-btn, error-msg, task-list, delete-btn-ID, close-promo-btn)
// ============================================================

// 1. SELECTOARE (Prindem elementele din HTML)
const form = document.querySelector('#add-task-form');
const inputNode = document.querySelector('#task-name');
const submitBtn = document.querySelector('#submit-task-btn');
const errorMsg = document.querySelector('#error-msg');
const taskList = document.querySelector('#task-list');
const spinner = document.querySelector('#loading-spinner');

// API-ul public pentru testare
const API_URL = 'https://jsonplaceholder.typicode.com/todos';

// 2. FUNCȚIE: Desenarea unui rând HTML în listă
const deseneazaTaskInDOM = (id, titlu) => {
  const li = document.createElement('li');
  li.className = 'task-item';

  // TODO Task 3: Adaugă atributul dinamic de test pe butonul de ștergere
  li.innerHTML = \`
    <span class="task-title">\${titlu}</span>
    <button class="btn-delete">Șterge</button>
  \`;

  taskList.appendChild(li);
};

// 3. GET: Aducerea celor 5 task-uri inițiale de la Server și ascunderea spinner-ului
const incarcaDateServer = async () => {
  try {
    const response = await fetch(\`\${API_URL}?_limit=5\`);
    if (!response.ok) throw new Error('A picat serverul!');
    const data = await response.json();

    // TODO Task 1: Ascunde indicatorul de latență (spinner.style.display = 'none')

    // Desenăm fiecare task primit
    data.forEach((task) => {
      deseneazaTaskInDOM(task.id, task.title);
    });
  } catch (error) {
    if (spinner) {
      spinner.textContent = 'Eroare la aducerea datelor!';
      spinner.style.backgroundColor = '#f8d7da';
    }
    console.error(error);
  }
};

incarcaDateServer();

// 4. POST: Adăugarea unui task nou pe rețea
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const taskTitle = inputNode.value.trim();
  if (!taskTitle) return;

  // TODO Task 1: Trimite noul task la server prin fetch cu method: "POST", headers JSON și body { title, completed: false, userId: 1 }
  // Adaugă-l în DOM cu deseneazaTaskInDOM doar după ce primești status 201 de la server.
  deseneazaTaskInDOM(Date.now(), taskTitle);
  inputNode.value = '';
});

// 5. VALIDARE LIVE: Evenimentul 'input' pentru deblocarea butonului și afișarea erorii
inputNode.addEventListener('input', () => {
  if (inputNode.value.trim().length > 0) {
    submitBtn.disabled = false;
    errorMsg.style.display = 'none';
  } else {
    submitBtn.disabled = true;
    errorMsg.style.display = 'block';
  }
});

// 6. EVENT DELEGATION pe lista <ul> (Ștergere pe rețea + Task 2: Marcare ca Finalizat)
taskList.addEventListener('click', async (e) => {
  // TODO Task 2: Dacă dăm click pe titlul task-ului (.task-title), adăugăm/eliminăm clasa .completed (e.target.classList.toggle('completed'))

  // TODO Task 1: Trimite cererea fetch pe rețea cu method: "DELETE" înainte de a elimina rândul din DOM (.remove())
  if (e.target.classList.contains('btn-delete')) {
    const deleteBtn = e.target;
    const randTask = deleteBtn.closest('.task-item');
    randTask.remove();
  }
});

// 7. MODUL CHAOS: Pop-up promoțional aleatoriu cu buton de închidere
const initChaosMode = () => {
  const randomDelay = Math.floor(Math.random() * 4000) + 2000;

  setTimeout(() => {
    // TODO Task 1 & 3: Creează pop-up-ul overlay-modal având un buton de închidere (close-promo-btn)
    // și ascultător de click pentru închiderea pop-up-ului (modal.remove()).
  }, randomDelay);
};

initChaosMode();
`;

const STARTER_TS_S7 = `/**
 * ==============================================================
 * Sesiunea 7: Trecerea la TypeScript (Task Tracker Refactoring)
 * ==============================================================
 * Obiectiv: Migrează scriptul aplicației din JavaScript în TypeScript.
 * Adaugă adnotări de tipuri explicite, elimină orice apariție a lui 'any'
 * și securizează modelele de date înainte de testele automate Playwright!
 */

// 1. Tipizarea Primitivelor & Variabilelor de Configurare
// Cerință: Declară explicit tipurile: apiUrl: string, maxTasksLimit: number, isAppReady: boolean
const apiUrl = 'https://jsonplaceholder.typicode.com/todos';
const maxTasksLimit = 5;
let isAppReady = false;

// 2. Tipul de Uniune (Union Type) pentru Statusul Task-ului
// Cerință: Definește un Type Alias numit TaskStatus ('todo' | 'in-progress' | 'completed')
// TODO: Definește type TaskStatus


// 3. Modelul de Date Tipizat (Type Alias TaskItem)
// Cerință: id: number, title: string, status: TaskStatus, completed: boolean, priority?: 'low' | 'medium' | 'high'
// TODO: Definește type TaskItem


// Declară array-ul principal tipizat explicit ca TaskItem[] (sau Array<TaskItem>)
// let listaTaskuri: TaskItem[] = [];


// 4. Semnăturile Funcțiilor & Eliminarea lui any (Zero Any Policy)
// Cerință: proceseazaTaskNou primește (taskObj: TaskItem) și returnează explicit : boolean
// TODO: Implementează proceseazaTaskNou


// Cerință: afiseazaTask primește (id: number) și returnează explicit : void
// TODO: Implementează afiseazaTask


// 5. Funcție Asincronă Tipizată (Fetch API & Promise)
// Cerință: async (): Promise<void> și asertare date primite cu as TaskItem[]
// const incarcaTaskuriInitiale = async (): Promise<void> => {
//   ...
// };
`;

export function transpileTsForPreview(code: string): string {
  if (!code) return '';
  let clean = code;
  clean = clean.replace(/^\s*(import|export)\s+.*?;?\s*$/gm, '');
  clean = clean.replace(/type\s+[A-Za-z0-9_]+\s*=\s*\{[\s\S]*?\};?/g, '');
  clean = clean.replace(/type\s+[A-Za-z0-9_]+\s*=\s*[^;]+;/g, '');
  clean = clean.replace(/interface\s+[A-Za-z0-9_]+[\s\S]*?\}/g, '');
  clean = clean.replace(/\s+as\s+[A-Za-z0-9_<>[\]]+/g, '');
  clean = clean.replace(/\)\s*:\s*[A-Za-z0-9_<>[\]| &]+\s*(=>|\{)/g, ') $1');
  clean = clean.replace(/:\s*(?:string|number|boolean|void|any|unknown|never|symbol|bigint|object|[A-Z][A-Za-z0-9_<>]*)(?:\[\])?\s*(?=[=,\)\n;]|$)/g, ' ');
  return clean;
}

const STARTER_PLAYWRIGHT = `import { test, expect } from '@playwright/test';

test('QualiAdept Task Tracker E2E Test', async ({ page }) => {
  // 1. Deschide aplicația
  await page.goto('https://qualiadept.eu');

  // 2. Localizează elementele și interacționează cu interfața

  // 3. Verifică starea cu aserțiuni web-first (expect)

});`;

export function parseInitialFiles(
  codePayload: string | null | undefined,
  moduleNum: number,
  validationType: string,
  sampleToForce?: string | null,
  previousPassedPayload?: string | null
): Record<string, string> {
  const defaultFiles = getModuleFiles(moduleNum, validationType);
  const initial: Record<string, string> = {};

  // 1. Populate starter scaffolds based on module number
  for (const f of defaultFiles) {
    if (f.name === 'index.html') {
      initial['index.html'] =
        moduleNum <= 1
          ? STARTER_HTML_S1
          : moduleNum === 2
            ? STARTER_HTML_S2
            : moduleNum <= 5
              ? STARTER_HTML_S3
              : STARTER_HTML_S6;
    } else if (f.name === 'style.css') {
      initial['style.css'] =
        moduleNum <= 2
          ? STARTER_CSS_S2
          : moduleNum <= 5
            ? STARTER_CSS_S3
            : STARTER_CSS_S6;
    } else if (f.name === 'app.js') {
      initial['app.js'] =
        moduleNum <= 3
          ? STARTER_JS_S3
          : moduleNum === 4
            ? STARTER_JS_S4
            : moduleNum === 5
              ? STARTER_JS_S5
              : STARTER_JS_S6;
    } else if (f.name === 'app.ts') {
      initial['app.ts'] = STARTER_TS_S7;
    } else if (f.name === 'e2e.spec.ts') {
      initial['e2e.spec.ts'] = STARTER_PLAYWRIGHT;
    }
  }

  // 1.5 Progressive Inheritance: Inherit student's validated files from previous module
  if (previousPassedPayload && previousPassedPayload.trim().length > 0) {
    try {
      const parsedPrev = JSON.parse(previousPassedPayload);
      if (parsedPrev && typeof parsedPrev.files === 'object' && !Array.isArray(parsedPrev.files)) {
        if (parsedPrev.files['index.html']) {
          let inheritedHtml = parsedPrev.files['index.html'];
          if (moduleNum >= 3 && !inheritedHtml.includes('app.js')) {
            inheritedHtml = inheritedHtml.replace('</body>', '  <script src="app.js"></script>\n</body>');
          }
          if (moduleNum >= 5 && !inheritedHtml.includes('active-tasks-list')) {
            if (inheritedHtml.includes('<section class="task-history-section">')) {
              inheritedHtml = inheritedHtml.replace(
                '<section class="task-history-section">',
                '<section class="active-tasks-section">\n      <h2>Task-uri Active (Server)</h2>\n      <ul id="active-tasks-list"></ul>\n    </section>\n\n    <section class="task-history-section">'
              );
            } else if (inheritedHtml.includes('</main>')) {
              inheritedHtml = inheritedHtml.replace(
                '</main>',
                '  <section class="active-tasks-section">\n      <h2>Task-uri Active (Server)</h2>\n      <ul id="active-tasks-list"></ul>\n    </section>\n  </main>'
              );
            }
          }
          if (moduleNum === 6) {
            // For Module 6 Capstone, ensure the inherited HTML has the error-msg, loading-spinner, and task-list containers
            if (!inheritedHtml.includes('loading-spinner') && !inheritedHtml.includes('spinner')) {
              inheritedHtml = inheritedHtml.replace(
                /(<ul id=["'](?:active-tasks-list|task-list)["'].*?>)/i,
                '<div id="loading-spinner" class="spinner">Se încarcă datele de la server...</div>\n      $1'
              );
            }
            if (!inheritedHtml.includes('error-msg') && inheritedHtml.includes('</form>')) {
              inheritedHtml = inheritedHtml.replace(
                '</form>',
                '  <small id="error-msg" class="error-text" style="display: none;">Numele task-ului nu poate fi gol!</small>\n      </form>'
              );
            }
            if (inheritedHtml.includes('id="active-tasks-list"') && !inheritedHtml.includes('id="task-list"')) {
              inheritedHtml = inheritedHtml.replace('id="active-tasks-list"', 'id="task-list"');
            }
          }
          if (moduleNum === 7) {
            if (inheritedHtml.includes('<script src="app.js"></script>')) {
              inheritedHtml = inheritedHtml.replace('<script src="app.js"></script>', '<script src="app.ts"></script>');
            } else if (!inheritedHtml.includes('app.ts') && inheritedHtml.includes('</body>')) {
              inheritedHtml = inheritedHtml.replace('</body>', '  <script src="app.ts"></script>\n</body>');
            }
          }
          initial['index.html'] = inheritedHtml;
        }

        if (parsedPrev.files['style.css']) {
          if (moduleNum === 6) {
            initial['style.css'] = `${parsedPrev.files['style.css'].trim()}\n\n${STARTER_CSS_S6}`;
          } else {
            initial['style.css'] = parsedPrev.files['style.css'];
          }
        }

        if (parsedPrev.files['app.js'] && parsedPrev.files['app.js'].trim().length > 0) {
          const prevJs = parsedPrev.files['app.js'];
          if (moduleNum === 6) {
            if (!prevJs.includes('Sesiunea 6: Livrarea Proiectului')) {
              initial['app.js'] = `${prevJs.trim()}\n\n// ============================================================\n// Sesiunea 6: Livrarea Proiectului "Task Tracker" (Capstone)\n// Cerințe de completat peste codul din Sesiunea 5:\n// 1. Ascunde spinner-ul (#loading-spinner) odată ce au sosit datele prin GET.\n// 2. Interceptează formularul și trimite noul task pe rețea prin fetch POST.\n// 3. Adaugă pe butonul de ștergere atributul data-testid="delete-btn-\${id}".\n// 4. Implementează marcare ca finalizat (toggle clasa 'completed' pe .task-title).\n// 5. Trimite cerere fetch DELETE pe rețea înainte de a elimina rândul din DOM.\n// 6. Adaugă pop-up-ul promoțional Chaos Mode cu butonul data-testid="close-promo-btn".\n// ============================================================\n`;
            } else {
              initial['app.js'] = prevJs;
            }
          } else if (moduleNum === 5 && !prevJs.includes('incarcaTaskuriInitiale')) {
            initial['app.js'] = `${prevJs.trim()}\n\n${STARTER_JS_S5}`;
          } else if (moduleNum === 4 && !prevJs.includes('Sesiunea 4: JS DOM Manipulation')) {
            initial['app.js'] = `${prevJs.trim()}\n\n${STARTER_JS_S4}`;
          } else {
            initial['app.js'] = prevJs;
          }
        }

        if (moduleNum === 7) {
          if (parsedPrev.files['app.ts'] && parsedPrev.files['app.ts'].trim().length > 0) {
            initial['app.ts'] = parsedPrev.files['app.ts'];
          } else {
            initial['app.ts'] = STARTER_TS_S7;
          }
        }
      }
    } catch {
      // Ignore parse errors on legacy single file
    }
  }

  // 2. If a saved submission or sample override is provided, parse and apply it over starters
  const rawSource = codePayload || sampleToForce;
  if (rawSource && rawSource.trim().length > 0) {
    try {
      const parsed = JSON.parse(rawSource);
      if (parsed && typeof parsed.files === 'object' && !Array.isArray(parsed.files)) {
        const merged = { ...initial, ...parsed.files };
        // Self-healing check: If index.html was corrupted with CSS comments/rules, recover HTML starter
        if (
          merged['index.html'] &&
          merged['style.css'] &&
          (merged['index.html'].trim().startsWith('/*') || !merged['index.html'].includes('<'))
        ) {
          merged['index.html'] =
            moduleNum <= 1
              ? STARTER_HTML_S1
              : moduleNum === 2
                ? STARTER_HTML_S2
                : moduleNum <= 5
                  ? STARTER_HTML_S3
                  : STARTER_HTML_S6;
        }
        // If app.js in the saved submission was just the untouched starter template, prefer inherited previous code
        if (
          moduleNum === 6 &&
          merged['app.js'] &&
          merged['app.js'].trim() === STARTER_JS_S6.trim() &&
          initial['app.js'] &&
          initial['app.js'] !== STARTER_JS_S6
        ) {
          merged['app.js'] = initial['app.js'];
        } else if (
          moduleNum === 5 &&
          merged['app.js'] &&
          merged['app.js'].trim() === STARTER_JS_S5.trim() &&
          initial['app.js'] &&
          initial['app.js'] !== STARTER_JS_S5
        ) {
          merged['app.js'] = initial['app.js'];
        } else if (
          moduleNum === 4 &&
          merged['app.js'] &&
          merged['app.js'].trim() === STARTER_JS_S4.trim() &&
          initial['app.js'] &&
          initial['app.js'] !== STARTER_JS_S4
        ) {
          merged['app.js'] = initial['app.js'];
        }
        // Ensure only files belonging to the current module are preserved (prevents legacy app.js leaking into module 7)
        const allowedFileNames = new Set(defaultFiles.map((f) => f.name));
        const filteredMerged: Record<string, string> = {};
        for (const [k, v] of Object.entries(merged)) {
          if (allowedFileNames.has(k)) {
            filteredMerged[k] = typeof v === 'string' ? v : String(v);
          }
        }
        return filteredMerged;
      }
    } catch {
      // Raw string source (legacy single file)
    }
    const primaryName = defaultFiles[0].name;
    // Self-healing check: if raw single file is CSS but primary is HTML, place it into style.css
    if (
      primaryName === 'index.html' &&
      (rawSource.trim().startsWith('/*') || !rawSource.includes('<')) &&
      defaultFiles.some((f) => f.name === 'style.css')
    ) {
      initial['style.css'] = rawSource;
    } else {
      initial[primaryName] = rawSource;
    }
  }

  // Ensure only files belonging to the current module are preserved
  const allowedFileNames = new Set(defaultFiles.map((f) => f.name));
  const filteredInitial: Record<string, string> = {};
  for (const [k, v] of Object.entries(initial)) {
    if (allowedFileNames.has(k)) {
      filteredInitial[k] = typeof v === 'string' ? v : String(v);
    }
  }
  return filteredInitial;
}

export default function AssignmentWorkspace({
  assignment,
  initialSubmissions = [],
  previousPassedPayload = null,
}: AssignmentWorkspaceProps) {
  const { data: session, status: authStatus } = useSession();
  const locale = useLocale();

  const [submissions, setSubmissions] = useState<SubmissionRecord[]>(initialSubmissions);
  const mostRecent = submissions.length > 0 ? submissions[0] : null;
  const isMostRecentPassed = mostRecent?.status === 'PASS';

  const availableFiles = useMemo(
    () => getModuleFiles(assignment.module, assignment.validationType),
    [assignment.module, assignment.validationType]
  );
  const [activeFile, setActiveFile] = useState<string>(availableFiles[0].name);
  const activeFileRef = useRef<string>(activeFile);
  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  // Keep references to mounted Monaco editor and monaco instance
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Multi-file state dictionary
  const [files, setFiles] = useState<Record<string, string>>(() =>
    parseInitialFiles(
      mostRecent?.codePayload,
      assignment.module,
      assignment.validationType,
      assignment.passingSample,
      previousPassedPayload
    )
  );

  // Always synchronized ref to current in-memory file contents
  const filesRef = useRef<Record<string, string>>(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Snapshot the freshest code directly from Monaco editor and models
  const getLatestFilesSnapshot = (): Record<string, string> => {
    const snapshot: Record<string, string> = { ...filesRef.current };

    // 1. Pull active editor value directly from Monaco instance if available
    if (editorRef.current && activeFileRef.current) {
      try {
        const currentVal = editorRef.current.getValue();
        if (typeof currentVal === 'string') {
          snapshot[activeFileRef.current] = currentVal;
        }
      } catch {
        // Ignore editor inspection errors
      }
    }

    // 2. Query all known Monaco models in memory to capture any modified tabs
    if (monacoRef.current?.editor) {
      try {
        const models = monacoRef.current.editor.getModels();
        for (const model of models) {
          const rawPath = model.uri?.path?.replace(/^\//, '');
          if (rawPath && (snapshot[rawPath] !== undefined || availableFiles.some((f) => f.name === rawPath))) {
            snapshot[rawPath] = model.getValue();
          }
        }
      } catch {
        // Ignore model query errors
      }
    }

    return snapshot;
  };

  const [showLivePreview, setShowLivePreview] = useState<boolean>(false);
  const [previewKey, setPreviewKey] = useState<number>(0);

  // Editor lock state for passed modules
  const [isUnlockedForEdit, setIsUnlockedForEdit] = useState<boolean>(!isMostRecentPassed);

  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isValidatingFile, setIsValidatingFile] = useState<string | null>(null);
  const tSync = useTranslations('GitHubSync');
  const [cooldown, setCooldown] = useState<number>(0);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const wt = getWorkspaceTranslations(locale);
  const [activeRightTab, setActiveRightTab] = useState<'criteria' | 'results'>(
    mostRecent?.feedbackJSON ? 'results' : 'criteria'
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(mostRecent?.id || null);

  const [isSyncingGitHub, setIsSyncingGitHub] = useState<boolean>(false);
  const [syncingTargetFile, setSyncingTargetFile] = useState<string | null>(null);
  const [githubSyncResult, setGithubSyncResult] = useState<{
    success: boolean;
    repoUrl?: string;
    commitUrl?: string;
    filePath?: string;
    message?: string;
    error?: string;
  } | null>(null);

  const saveDraftLocally = (payload: Record<string, string> | string) => {
    if (typeof window === 'undefined') return;
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
    try {
      localStorage.setItem(`qualiadept_draft_mf_${assignment.id}`, str);
      localStorage.setItem(`qualiadept_draft_mf_mod_${assignment.module}`, str);
    } catch {
      // Ignore quota errors if any
    }
  };

  const removeDraftLocally = () => {
    if (typeof window === 'undefined') return;
    const candidateKeys = [
      `qualiadept_draft_mf_${assignment.id}`,
      `qualiadept_draft_mf_mod_${assignment.module}`,
      `qualiadept_draft_${assignment.id}`,
      `qualiadept_draft_mod_${assignment.module}`,
    ];
    for (const key of candidateKeys) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
    }
  };

  // 1. Initial mount: restore saved draft from localStorage ONCE (unless assignment is already passed)
  const hasRestoredDraftRef = useRef<boolean>(false);
  useEffect(() => {
    if (hasRestoredDraftRef.current) return;
    if (typeof window !== 'undefined' && !isMostRecentPassed) {
      hasRestoredDraftRef.current = true;
      const candidateKeys = [
        `qualiadept_draft_mf_${assignment.id}`,
        `qualiadept_draft_mf_mod_${assignment.module}`,
        `qualiadept_draft_${assignment.id}`,
        `qualiadept_draft_mod_${assignment.module}`,
      ];

      let savedDraft: string | null = null;
      for (const key of candidateKeys) {
        const val = localStorage.getItem(key);
        if (val && val.trim().length > 0) {
          savedDraft = val;
          break;
        }
      }

      if (savedDraft && savedDraft.trim().length > 0) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === 'object') {
            const draftFiles = parsed.files && typeof parsed.files === 'object' ? parsed.files : parsed;
            const merged = { ...draftFiles };
            if (
              merged['index.html'] &&
              merged['style.css'] &&
              (merged['index.html'].trim().startsWith('/*') || !merged['index.html'].includes('<'))
            ) {
              merged['index.html'] =
                assignment.module <= 1
                  ? STARTER_HTML_S1
                  : assignment.module === 2
                    ? STARTER_HTML_S2
                    : assignment.module <= 5
                      ? STARTER_HTML_S3
                      : STARTER_HTML_S6;
            }
            // Auto-heal empty or rule-less style.css draft
            if (
              assignment.module >= 3 &&
              merged['style.css'] &&
              !merged['style.css'].includes('{')
            ) {
              merged['style.css'] = assignment.module >= 6 ? STARTER_CSS_S6 : STARTER_CSS_S3;
            }
            // Ensure script src="app.js" is present in Module >= 3 index.html
            if (
              assignment.module >= 3 &&
              merged['index.html'] &&
              !merged['index.html'].includes('app.js')
            ) {
              merged['index.html'] = merged['index.html'].replace(
                '</body>',
                '  <script src="app.js"></script>\n</body>'
              );
            }
            filesRef.current = merged;
            setFiles((prev) => ({ ...prev, ...merged }));
            return;
          }
        } catch {
          if (!savedDraft.trim().startsWith('/*')) {
            const fallback = { [availableFiles[0].name]: savedDraft };
            filesRef.current = { ...filesRef.current, ...fallback };
            setFiles((prev) => ({ ...prev, ...fallback }));
          }
        }
      }
    }
  }, [assignment.id, assignment.module, isMostRecentPassed, availableFiles]);

  // 2. Debounced Autosave editor code state changes to localStorage (500ms debounce)
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(files).length > 0 && !isMostRecentPassed) {
      const handler = setTimeout(() => {
        saveDraftLocally(files);
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [files, isMostRecentPassed, assignment.id, assignment.module]);

  // 3. Cooldown timer for anti-spam (10s countdown)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // 4. Sync initial most recent submission result to Green Wall
  useEffect(() => {
    if (mostRecent?.feedbackJSON) {
      try {
        const parsed: ValidationResponse = JSON.parse(mostRecent.feedbackJSON);
        setValidationResult(parsed);
        setActiveRightTab('results');
      } catch {
        // Fallback if parsing fails
      }
    }
  }, [mostRecent]);

  const handleActiveFileChange = (newVal: string, targetFileName?: string) => {
    const fileToUpdate = targetFileName || activeFileRef.current;
    filesRef.current[fileToUpdate] = newVal;
    setFiles((prev) => {
      if (prev[fileToUpdate] === newVal) return prev;
      return {
        ...prev,
        [fileToUpdate]: newVal,
      };
    });
  };

  const handleValidation = async () => {
    if (!session?.user) {
      setSubmitError('Authentication Required: Please sign in with GitHub before submitting code.');
      return;
    }

    setIsValidating(true);
    setSubmitError(null);

    // Snapshot latest code directly from Monaco editor and models
    const latestFiles = getLatestFilesSnapshot();
    filesRef.current = latestFiles;
    setFiles(latestFiles);
    saveDraftLocally(latestFiles);

    const payloadString = JSON.stringify({ files: latestFiles });
    const htmlCode = latestFiles['index.html'] || latestFiles['sandbox.html'] || latestFiles[activeFile] || '';

    try {
      const endpoint =
        assignment.validationType === 'DYNAMIC'
          ? '/api/validate/dynamic'
          : '/api/validate/static';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId: assignment.id,
          codePayload: payloadString,
          files: latestFiles,
          htmlCode,
          locale,
        }),
      });

      if (res.status === 401) {
        saveDraftLocally(payloadString);
        setSubmitError(
          'Sesiunea ta a expirat. Codul a fost salvat local. Te rugăm să dai refresh și să te reautentifici.'
        );
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Validation server returned error code ${res.status}`);
      }

      const result: ValidationResponse = await res.json();
      setValidationResult(result);
      setActiveRightTab('results');
      setActiveRightTab('results');

      // Prepend newly created submission record to history state
      const newRecord: SubmissionRecord = {
        id: `submission-${Date.now()}`,
        codePayload: payloadString,
        status: result.status.toUpperCase(),
        score: result.score,
        feedbackJSON: JSON.stringify(result),
        submittedAt: new Date().toISOString(),
      };

      setSubmissions((prev) => [newRecord, ...prev]);
      setSelectedHistoryId(newRecord.id);

      if (result.status === 'pass') {
        setIsUnlockedForEdit(false);
        removeDraftLocally();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error occurred while submitting code.';
      setSubmitError(msg);
    } finally {
      setIsValidating(false);
      setCooldown(2);
    }
  };

  const handleValidateFile = async (targetFile: string) => {
    if (!session?.user) {
      setSubmitError('Authentication Required: Please sign in with GitHub before checking code.');
      return;
    }

    setIsValidatingFile(targetFile);
    setSubmitError(null);

    // Snapshot latest code directly from Monaco editor and models
    const latestFiles = getLatestFilesSnapshot();
    filesRef.current = latestFiles;
    setFiles(latestFiles);
    saveDraftLocally(latestFiles);

    const payloadString = JSON.stringify({ files: latestFiles });
    const htmlCode = latestFiles['index.html'] || latestFiles['sandbox.html'] || latestFiles[activeFile] || '';

    try {
      const endpoint =
        assignment.validationType === 'DYNAMIC'
          ? '/api/validate/dynamic'
          : '/api/validate/static';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId: assignment.id,
          codePayload: payloadString,
          files: latestFiles,
          htmlCode,
          targetFile,
          locale,
        }),
      });

      if (res.status === 401) {
        saveDraftLocally(payloadString);
        setSubmitError(
          'Sesiunea ta a expirat. Codul a fost salvat local. Te rugăm să dai refresh și să te reautentifici.'
        );
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Validation server returned error code ${res.status}`);
      }

      const result: ValidationResponse = await res.json();
      setValidationResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error occurred while checking file.';
      setSubmitError(msg);
    } finally {
      setIsValidatingFile(null);
    }
  };

  const triggerGitHubSync = async (codeToSync?: string, targetFile?: string) => {
    if (isSyncingGitHub) return;
    setIsSyncingGitHub(true);
    setSyncingTargetFile(targetFile || null);

    const payload = codeToSync || JSON.stringify({ files });

    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          codePayload: payload,
          targetFile,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setGithubSyncResult({
          success: false,
          error: data.code || 'SYNC_FAILED',
          message: data.error || tSync('reauthRequired'),
        });
      } else {
        setGithubSyncResult({
          success: true,
          repoUrl: data.repoUrl,
          commitUrl: data.commitUrl,
          filePath: data.filePath,
          message: targetFile
            ? `✓ Fișierul ${targetFile} a fost sincronizat cu succes pe GitHub!`
            : tSync('success'),
        });
      }
    } catch (err: unknown) {
      setGithubSyncResult({
        success: false,
        error: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error syncing with GitHub.',
      });
    } finally {
      setIsSyncingGitHub(false);
      setSyncingTargetFile(null);
    }
  };

  const loadHistorySubmission = (record: SubmissionRecord) => {
    setSelectedHistoryId(record.id);
    const restored = parseInitialFiles(
      record.codePayload,
      assignment.module,
      assignment.validationType,
      null,
      previousPassedPayload
    );
    filesRef.current = restored;
    setFiles(restored);

    if (editorRef.current && activeFileRef.current && restored[activeFileRef.current] !== undefined) {
      try {
        editorRef.current.setValue(restored[activeFileRef.current]);
      } catch {
        // Ignore editor setValue error
      }
    }

    try {
      const parsed: ValidationResponse = JSON.parse(record.feedbackJSON);
      setValidationResult(parsed);
    } catch {
      // Ignore parse error
    }
  };

  const currentFileObj = availableFiles.find((f) => f.name === activeFile) || availableFiles[0];
  const activeCode = files[activeFile] || '';

  // Generate complete HTML document for Live Preview sandbox
  const previewScript = files['app.ts']
    ? transpileTsForPreview(files['app.ts'])
    : (files['app.js'] || '');

  const livePreviewHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${files['style.css'] || ''}
  </style>
</head>
<body>
  ${(files['index.html'] || files['sandbox.html'] || '')
      .replace(/<!DOCTYPE.*?>/i, '')
      .replace(/<html.*?>/i, '')
      .replace(/<\/html>/i, '')
      .replace(/<head[\s\S]*?<\/head>/i, '')
      .replace(/<body.*?>/i, '')
      .replace(/<\/body>/i, '')}
  <script>
    try {
      ${previewScript}
    } catch (err) {
      console.error('QualiAdept sandbox runtime error:', err);
    }
  </script>
</body>
</html>`;

  const isTrainer = session?.user?.role === 'TRAINER';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 flex flex-col">
      {/* Top Header / Brand & Auth Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors mr-2">
              <span>← Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-zinc-800 hidden sm:block"></div>
            <Link href="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:border-emerald-400/60 transition-colors">
                Q
              </div>
              <span className="font-semibold text-zinc-100 tracking-wide text-sm hidden sm:inline group-hover:text-white transition-colors">QualiAdept</span>
            </Link>
          </div>

          {/* User Profile / Auth Status */}
          <div className="flex items-center gap-3">
            {authStatus === 'loading' ? (
              <div className="h-8 w-32 bg-zinc-900 rounded-full animate-pulse border border-zinc-800"></div>
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/leaderboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-800/60 text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                >
                  <span>🏆 Leaderboard</span>
                </Link>
                {isTrainer && (
                  <Link
                    href="/trainer"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                  >
                    <span>⚡ God Mode Dashboard</span>
                  </Link>
                )}
                <div className="flex items-center gap-2.5 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User Avatar'}
                      className="h-6 w-6 rounded-full border border-zinc-700 object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white">
                      {(session.user.name || 'U').charAt(0)}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-medium text-zinc-200 leading-tight">
                      {session.user.name || 'Student'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono leading-tight">
                      {session.user.role || 'STUDENT'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => signOut()}
                  className="text-xs text-zinc-400 hover:text-rose-400 font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-rose-900 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('github')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all shadow-md cursor-pointer font-mono"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Sign In with GitHub
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto w-full flex-1 px-4 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        {/* Assignment Hero Header */}
        <section className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-5 sm:p-6 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-zinc-800 text-cyan-400 border border-zinc-700">
                  Module {assignment.module}
                </span>
                <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/60 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                  {assignment.validationType} Validation
                </span>
                {isMostRecentPassed && (
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-semibold">
                    ✓ Module Completed
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 tracking-tight">
                {assignment.title}
              </h1>
              <div
                className="text-zinc-400 text-sm mt-1 max-w-3xl leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(assignment.description),
                }}
              />
            </div>

            {/* User Session Quick Card */}
            <div className="flex items-center gap-4 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/80 text-xs font-mono self-start md:self-auto">
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">Submissions</span>
                <span className="text-emerald-400 font-bold block">{submissions.length} Attempts</span>
              </div>
              <div className="h-8 w-px bg-zinc-800"></div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">Role</span>
                <span className="text-emerald-400 font-semibold uppercase block">
                  {session?.user?.role || 'Guest'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Passed Status & Resubmit Banner */}
        {isMostRecentPassed && !isUnlockedForEdit && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-200">Assignment Passed!</h3>
                <p className="text-xs text-emerald-400/90 mt-0.5">
                  The editor is read-only to prevent accidental overwrites. Click &quot;Edit / Resubmit&quot; to modify your solution.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsUnlockedForEdit(true)}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono transition-all shadow-md cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
            >
              🔓 Edit / Resubmit Code
            </button>
          </div>
        )}

        {/* 2-Column Interactive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Code Editor & Submission History (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Code Editor Window */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl flex flex-col">
              {/* Window Bar / Tab Controls */}
              <div className="bg-zinc-950 px-3 py-2.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                  <div className="flex items-center gap-1.5 mr-2 shrink-0">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block"></span>
                    <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block"></span>
                  </div>

                  {/* Multi-File Tab List */}
                  <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-850">
                    {availableFiles.map((f) => {
                      const isActive = activeFile === f.name;
                      return (
                        <button
                          key={f.name}
                          type="button"
                          onClick={() => setActiveFile(f.name)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${isActive
                              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                            }`}
                        >
                          <span>{f.icon}</span>
                          <span>{f.name}</span>
                          {files[f.name] && files[f.name].trim().length > 0 && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 inline-block ml-0.5"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Controls: Quick File Check, Reset Code & Live Preview Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleValidateFile(activeFile)}
                    disabled={isValidating || Boolean(isValidatingFile) || !isUnlockedForEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    title={`Rulează verificarea rapidă pentru ${activeFile}`}
                  >
                    {isValidatingFile === activeFile ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-emerald-300" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Checking {activeFile}...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡ Check {activeFile}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const fresh = parseInitialFiles(
                        null,
                        assignment.module,
                        assignment.validationType,
                        null,
                        previousPassedPayload
                      );
                      filesRef.current = fresh;
                      setFiles(fresh);
                      if (editorRef.current && activeFileRef.current && fresh[activeFileRef.current] !== undefined) {
                        try {
                          editorRef.current.setValue(fresh[activeFileRef.current]);
                        } catch {
                          // Ignore
                        }
                      }
                      removeDraftLocally();
                      setIsUnlockedForEdit(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                    title={
                      previousPassedPayload
                        ? `Resetează și preia codul validat din Sesiunea ${assignment.module - 1}`
                        : 'Resetează fișierele la codul inițial de pornire'
                    }
                  >
                    <span>🔄 Reset Code</span>
                  </button>

                  {assignment.validationType !== 'DYNAMIC' && (
                    <button
                      type="button"
                      onClick={() => setShowLivePreview((prev) => !prev)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer border ${showLivePreview
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                          : 'bg-zinc-900 text-zinc-300 hover:text-zinc-100 border-zinc-800 hover:bg-zinc-800'
                        }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${showLivePreview ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`}></span>
                      <span>{showLivePreview ? 'Hide Preview' : '👁️ Live Preview'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Tab Subheader Banner */}
              <div className="bg-zinc-950/60 px-4 py-1.5 border-b border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Editing:</span>
                  <span className="text-emerald-400 font-bold">{activeFile}</span>
                  <span className="text-zinc-600">({currentFileObj.language})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>{availableFiles.length} project files</span>
                  <span className="text-zinc-600">•</span>
                  <span>{activeCode.split('\n').length} lines</span>
                </div>
              </div>

              {/* VS Code Monaco Editor Window */}
              <div className="relative bg-zinc-950 p-2 sm:p-3 font-mono text-sm w-full max-w-full overflow-hidden border-b border-zinc-800">
                <Editor
                  key={activeFile}
                  path={activeFile}
                  height="460px"
                  language={currentFileObj.language}
                  theme="vs-dark"
                  value={activeCode}
                  onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    monacoRef.current = monaco;
                  }}
                  onChange={(value) => handleActiveFileChange(value || '', activeFile)}
                  loading={
                    <div className="h-[460px] w-full flex flex-col items-center justify-center gap-3 bg-zinc-950 text-zinc-400 font-mono text-xs border border-zinc-800 rounded-xl">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
                      <span>Loading VS Code engine...</span>
                    </div>
                  }
                  options={{
                    readOnly: !isUnlockedForEdit,
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    automaticLayout: true,
                    tabSize: 2,
                    formatOnPaste: true,
                    contextmenu: true,
                  }}
                />
              </div>

              {/* Sandboxed Live Preview Drawer */}
              {showLivePreview && assignment.validationType !== 'DYNAMIC' && (
                <div className="bg-zinc-950 border-b border-zinc-800 flex flex-col transition-all">
                  <div className="bg-zinc-900/90 px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      <span className="font-semibold text-zinc-200">Live Application Sandbox Preview</span>
                      <span className="text-[10px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        Sandboxed Iframe (HTML + CSS + JS)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewKey((k) => k + 1)}
                      className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800"
                      title="Reload sandbox preview"
                    >
                      <span>🔄 Reload Preview</span>
                    </button>
                  </div>

                  <div className="p-3 bg-zinc-950">
                    <div className="w-full h-[320px] rounded-xl overflow-hidden border border-zinc-800 bg-white shadow-inner">
                      <iframe
                        key={previewKey}
                        title="QualiAdept App Preview Sandbox"
                        srcDoc={livePreviewHtml}
                        sandbox="allow-scripts allow-forms"
                        className="w-full h-full border-0 bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Editor Footer / Submit CTA Bar */}
              <div className="bg-zinc-950/90 px-4 py-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                  <span>Active: <strong className="text-zinc-200">{activeFile}</strong></span>
                  <span>Total Files: <strong className="text-emerald-400">{Object.keys(files).length}</strong></span>
                </div>

                {session?.user ? (
                  isUnlockedForEdit ? (
                    <button
                      type="button"
                      onClick={handleValidation}
                      disabled={isValidating || cooldown > 0}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-zinc-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isValidating ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>⚙️ Validating Project...</span>
                        </>
                      ) : cooldown > 0 ? (
                        <span>⏳ Please wait {cooldown}s</span>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{wt.submitProject}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => triggerGitHubSync()}
                        disabled={isSyncingGitHub}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-cyan-300 border border-zinc-700 font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        title={tSync('syncButton')}
                      >
                        {isSyncingGitHub ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{tSync('syncing')}</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                            <span>{tSync('syncButton')}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsUnlockedForEdit(true)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-emerald-300 border border-zinc-700 font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>🔓 Unlock Editor</span>
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => signIn('github')}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-100 font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Sign In with GitHub to Submit</span>
                  </button>
                )}
              </div>
            </div>

            {/* GitHub Sync Status Card */}
            {githubSyncResult && (
              <div
                className={`p-4 rounded-xl border text-xs font-mono flex items-start gap-3 transition-all ${githubSyncResult.success
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                  }`}
              >
                <div className="shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-current" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="font-semibold text-zinc-100 flex items-center justify-between">
                    <span>{githubSyncResult.success ? 'GitHub Auto-Sync' : 'GitHub Sync Notice'}</span>
                    {githubSyncResult.filePath && (
                      <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {githubSyncResult.filePath}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {githubSyncResult.message}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {githubSyncResult.commitUrl && (
                      <a
                        href={githubSyncResult.commitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline underline-offset-4 text-[11px]"
                      >
                        <span>🔗 {tSync('viewCommit')}</span>
                        <span>↗</span>
                      </a>
                    )}
                    {githubSyncResult.repoUrl && (
                      <a
                        href={githubSyncResult.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline underline-offset-4 text-[11px]"
                      >
                        <span>📁 {tSync('viewRepo')}</span>
                        <span>↗</span>
                      </a>
                    )}
                    {!githubSyncResult.success && (
                      <button
                        type="button"
                        onClick={() => signIn('github')}
                        className="px-3 py-1 bg-amber-900/80 hover:bg-amber-800 text-amber-100 rounded text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        {tSync('reauthButton')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Validation Error Alert */}
            {submitError && (
              <div className="bg-rose-950/80 border border-rose-800 p-4 rounded-xl text-rose-200 text-sm flex items-start gap-3">
                <svg className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-rose-100">Submission Alert</h4>
                  <p className="text-xs text-rose-300 mt-1">{submitError}</p>
                </div>
                {(!session?.user || submitError.includes('expirat')) && (
                  <button
                    onClick={() => signIn('github')}
                    className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-rose-100 rounded text-xs font-mono transition-colors shrink-0"
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}

            {/* Submission History Section ("Git Commit Log") */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-cyan-400 text-xs font-mono font-bold">
                    ⌥
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">Submission History Log</h3>
                    <p className="text-[11px] text-zinc-400 font-mono">Git commit history for this module</p>
                  </div>
                </div>

                <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                  {submissions.length} {submissions.length === 1 ? 'Attempt' : 'Attempts'}
                </span>
              </div>

              {submissions.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 text-xs text-zinc-500 font-mono">
                  No submissions recorded yet for this module.
                </div>
              ) : (
                <div className="space-y-2">
                  {submissions.map((sub, idx) => {
                    const isSelected = selectedHistoryId === sub.id;
                    const isPass = sub.status === 'PASS';
                    const dateFormatted = new Date(sub.submittedAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    });

                    return (
                      <div
                        key={sub.id || idx}
                        onClick={() => loadHistorySubmission(sub)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer font-mono text-xs ${isSelected
                            ? 'bg-zinc-800/90 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Git Commit Dot Status */}
                          <div
                            className={`h-3 w-3 rounded-full flex-shrink-0 ${isPass ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                              }`}
                          ></div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-200 truncate">
                                Attempt #{submissions.length - idx}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold ${isPass
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                                  }`}
                              >
                                {sub.status}
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {dateFormatted}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs font-bold text-zinc-300 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                            {sub.score}%
                          </span>
                          <button
                            type="button"
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${isSelected
                                ? 'bg-cyan-500 text-zinc-950'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                              }`}
                          >
                            {isSelected ? 'Active Code' : 'Load Code'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Feedback & Requirements UI (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 sm:p-6 shadow-xl flex flex-col gap-5 min-h-[500px]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                    {wt.greenWallTitle}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {assignment.validationType === 'DYNAMIC' ? wt.playwrightEngine : wt.domAssertions}
                  </p>
                </div>
                {validationResult && (
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                    Response 200 OK
                  </span>
                )}
              </div>

              {/* Tab Navigation: [ 📋 Cerințe & Ghid ] | [ ✓ Rezultate Validare ] */}
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveRightTab('criteria')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeRightTab === 'criteria'
                      ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  <span>📋</span>
                  <span>{wt.tabCriteria}</span>
                </button>

                {validationResult && (
                  <button
                    type="button"
                    onClick={() => setActiveRightTab('results')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeRightTab === 'results'
                        ? validationResult.status === 'pass'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 shadow-sm'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-500/50 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
                    }`}
                  >
                    <span>{validationResult.status === 'pass' ? '✓' : '✕'}</span>
                    <span>
                      {wt.tabResults} ({validationResult.score}%)
                    </span>
                  </button>
                )}
              </div>

              {/* View 1: Cerințe & Ghid (Always accessible!) */}
              {!isValidating && !isValidatingFile && activeRightTab === 'criteria' && (() => {
                const curriculumInfo = getAssignmentCurriculumTask(assignment, locale);
                const grouped = curriculumInfo.criteria.reduce((acc, item) => {
                  if (!acc[item.file]) acc[item.file] = [];
                  acc[item.file].push(item);
                  return acc;
                }, {} as Record<string, typeof curriculumInfo.criteria>);

                return (
                  <div className="flex-1 flex flex-col text-left p-4 sm:p-5 border border-zinc-800 rounded-xl bg-zinc-950/40 gap-4 overflow-y-auto max-h-[750px]">
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/80">
                      <div className="h-9 w-9 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-200">{wt.guideHeader}</h3>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          {wt.guideSubhead}
                        </p>
                      </div>
                    </div>

                    {/* Business Task Card */}
                    <div className="bg-zinc-900/70 border border-zinc-800 p-3.5 rounded-lg">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider mb-1.5">
                        <span>🎯</span>
                        <span>{wt.businessTask}</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {curriculumInfo.businessTask}
                      </p>
                      {curriculumInfo.notes && (
                        <div className="mt-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed">
                          <span className="text-amber-400 font-semibold font-mono">💡 {wt.note} </span>
                          {curriculumInfo.notes}
                        </div>
                      )}
                    </div>

                    {/* Acceptance Criteria Checklist (Grouped by file) */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <span>📋</span>
                          <span>{wt.technicalCriteria}</span>
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          {wt.requirementsCount(curriculumInfo.criteria.length)}
                        </span>
                      </div>

                      {Object.entries(grouped).map(([file, items]) => (
                        <div key={file} className="bg-zinc-900/60 border border-zinc-800/90 rounded-lg p-3 flex flex-col gap-2">
                          <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-800 text-xs font-mono font-bold text-zinc-300">
                            <span>{file.endsWith('.css') ? '🎨' : file.endsWith('.ts') ? '🔷' : file.endsWith('.js') ? '📜' : '🌐'}</span>
                            <span className="text-zinc-100">{file}</span>
                            <span className="text-[10px] text-zinc-400 font-normal">({wt.requirementsCount(items.length)})</span>
                          </div>
                          <ul className="space-y-2 text-xs">
                            {items.map((criterion, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-zinc-300">
                                <span className="text-zinc-500 font-mono text-sm leading-none mt-0.5">○</span>
                                <div className="flex-1 text-[11px] leading-snug">
                                  <strong className="text-zinc-200">{criterion.title}</strong>
                                  {criterion.detail && (
                                    <div className="text-zinc-400 font-mono text-[10px] mt-0.5">{criterion.detail}</div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Helper Hint */}
                    <div className="text-[11px] text-zinc-400 font-mono bg-zinc-900/40 p-2.5 rounded border border-zinc-800/60 flex items-center gap-2 mt-auto">
                      <span>⚡</span>
                      <span>{wt.bottomTip}</span>
                    </div>
                  </div>
                );
              })()}

              {/* State 2: Validating Loader */}
              {(isValidating || Boolean(isValidatingFile)) && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-zinc-800 rounded-xl bg-zinc-950/60">
                  <div className="relative mb-4">
                    <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping"></span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    {isValidatingFile ? `Checking ${isValidatingFile}...` : 'Parsing AST & Evaluating'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 font-mono">
                    {isValidatingFile
                      ? `Running targeted assertions for ${isValidatingFile}...`
                      : 'Running automated DOM inspectors...'}
                  </p>
                </div>
              )}

              {/* State 3: Rendered Results ("Green Wall") */}
              {activeRightTab === 'results' && validationResult && !isValidating && !isValidatingFile && (
                <div className="flex flex-col gap-5">
                  {/* Overall Status Banner */}
                  <div
                    className={`rounded-xl p-5 border shadow-lg transition-all ${validationResult.status === 'pass'
                        ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                        : 'bg-rose-950/40 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-2xl ${validationResult.status === 'pass'
                              ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                              : 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                            }`}
                        >
                          {validationResult.status === 'pass' ? '✓' : '✕'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded ${validationResult.status === 'pass'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}
                            >
                              {validationResult.isPartial
                                ? `PARTIAL CHECK: ${validationResult.targetFile}`
                                : `Status: ${validationResult.status.toUpperCase()}`}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-zinc-50 mt-1">
                            {validationResult.isPartial
                              ? validationResult.status === 'pass'
                                ? `All checks passed for ${validationResult.targetFile}!`
                                : `Issues found in ${validationResult.targetFile}`
                              : validationResult.status === 'pass'
                                ? 'All Checks Passed!'
                                : 'Validation Failed'}
                          </h3>
                        </div>
                      </div>

                      {/* Score Badge Gauge */}
                      <div className="flex flex-col items-end">
                        <span className="text-3xl font-black font-mono tracking-tight text-zinc-50">
                          {validationResult.score}%
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">
                          Score
                        </span>
                      </div>
                    </div>

                    {/* Progress Score Bar */}
                    <div className="mt-4 w-full bg-zinc-950 h-2 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${validationResult.status === 'pass' ? 'bg-emerald-400' : 'bg-rose-500'
                          }`}
                        style={{ width: `${validationResult.score}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Partial Check Notice & Per-File GitHub Sync Banner */}
                  {validationResult.isPartial && (
                    <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⚡</span>
                        <span>
                          Verificare parțială pentru <strong className="text-zinc-200">{validationResult.targetFile}</strong>. Când ești gata, trimite întregul proiect cu butonul &quot;Submit Project for Validation&quot;.
                        </span>
                      </div>

                      {validationResult.status === 'pass' && validationResult.targetFile && (
                        <button
                          type="button"
                          onClick={() => triggerGitHubSync(undefined, validationResult.targetFile)}
                          disabled={isSyncingGitHub}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-800/60 font-semibold text-xs transition-all font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-end sm:self-auto shadow-sm"
                          title={`Sincronizează doar ${validationResult.targetFile} în repository-ul tău de GitHub`}
                        >
                          {isSyncingGitHub && syncingTargetFile === validationResult.targetFile ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Syncing {validationResult.targetFile}...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                              </svg>
                              <span>🐙 Sync {validationResult.targetFile} to GitHub</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Module Unlocked CTA Banner (Only on full submissions) */}
                  {!validationResult.isPartial && validationResult.status === 'pass' && (
                    <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <span>🎉 Module Passed!</span>
                        </div>
                        <p className="text-[11px] text-emerald-400/90 mt-0.5">
                          Next module in curriculum is now unlocked on your Dashboard.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => triggerGitHubSync()}
                          disabled={isSyncingGitHub}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-800/60 font-semibold text-xs transition-all font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Manually push your code to your personal GitHub repository"
                        >
                          {isSyncingGitHub ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Syncing...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                              </svg>
                              <span>🐙 {wt.syncToGitHub}</span>
                            </>
                          )}
                        </button>
                        <Link
                          href="/"
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-semibold text-xs hover:bg-emerald-400 transition-all font-mono shadow-md whitespace-nowrap"
                        >
                          Dashboard →
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Assertion Breakdown Checklist (Grouped by File) */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                        Assertion Results ({validationResult.feedback.filter((f) => f.passed).length}/
                        {validationResult.feedback.length})
                      </h4>
                      <span className="text-[11px] font-mono text-zinc-500">
                        Evaluated across {Object.keys(
                          validationResult.feedback.reduce((acc, item) => {
                            const k = item.file || (item.check.includes('style.css') ? 'style.css' : 'index.html');
                            acc[k] = true;
                            return acc;
                          }, {} as Record<string, boolean>)
                        ).length} {Object.keys(
                          validationResult.feedback.reduce((acc, item) => {
                            const k = item.file || (item.check.includes('style.css') ? 'style.css' : 'index.html');
                            acc[k] = true;
                            return acc;
                          }, {} as Record<string, boolean>)
                        ).length === 1 ? 'file' : 'files'}
                      </span>
                    </div>

                    {(() => {
                      const groupedFeedback = validationResult.feedback.reduce((acc, item) => {
                        let fileKey = item.file;
                        if (!fileKey) {
                          if (item.check.includes('[style.css]') || item.check.toLowerCase().includes('style.css') || item.check.toLowerCase().includes('stilizare')) {
                            fileKey = 'style.css';
                          } else if (item.check.includes('[app.js]') || item.check.toLowerCase().includes('app.js') || item.check.toLowerCase().includes('javascript')) {
                            fileKey = 'app.js';
                          } else {
                            fileKey = 'index.html';
                          }
                        }
                        if (!acc[fileKey]) {
                          acc[fileKey] = [];
                        }
                        acc[fileKey].push(item);
                        return acc;
                      }, {} as Record<string, FeedbackItem[]>);

                      return (
                        <div className="flex flex-col gap-4">
                          {Object.entries(groupedFeedback).map(([fileName, items]) => {
                            const passedCount = items.filter((f) => f.passed).length;
                            const isAllPass = passedCount === items.length;
                            const fileIcon = fileName.endsWith('.css')
                              ? '🎨'
                              : fileName.endsWith('.ts')
                                ? '🔷'
                                : fileName.endsWith('.js')
                                  ? '📜'
                                  : '🌐';

                            return (
                              <div
                                key={fileName}
                                className="bg-zinc-950/70 border border-zinc-800/90 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-md"
                              >
                                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{fileIcon}</span>
                                    <span className="font-mono text-xs font-bold text-zinc-200">{fileName}</span>
                                    <span
                                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${isAllPass
                                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                                        }`}
                                    >
                                      {passedCount}/{items.length} Passed
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {isAllPass && (
                                      <button
                                        type="button"
                                        onClick={() => triggerGitHubSync(undefined, fileName)}
                                        disabled={isSyncingGitHub}
                                        className="text-[11px] font-mono px-2.5 py-1 rounded transition-all flex items-center gap-1 cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-800/60 font-semibold disabled:opacity-50"
                                        title={`Sincronizează ${fileName} pe GitHub`}
                                      >
                                        {isSyncingGitHub && syncingTargetFile === fileName ? (
                                          <>
                                            <svg className="animate-spin h-3 w-3 text-cyan-400" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Syncing...</span>
                                          </>
                                        ) : (
                                          <>
                                            <span>🐙 Sync {fileName}</span>
                                          </>
                                        )}
                                      </button>
                                    )}

                                    {availableFiles.some((f) => f.name === fileName) && (
                                      <button
                                        type="button"
                                        onClick={() => setActiveFile(fileName)}
                                        className={`text-[11px] font-mono px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${activeFile === fileName
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                                          }`}
                                      >
                                        <span>{activeFile === fileName ? '✓ Active Editor' : `Open ${fileName} →`}</span>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className={`p-3 rounded-lg border flex items-start gap-2.5 transition-all ${item.passed
                                          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-100'
                                          : 'bg-rose-950/20 border-rose-800/40 text-rose-100'
                                        }`}
                                    >
                                      <div
                                        className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold ${item.passed
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                          }`}
                                      >
                                        {item.passed ? '✓' : '✕'}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <h5 className="text-xs font-semibold text-zinc-100 truncate">
                                            {item.check.replace(/^\[.*?\]\s*/, '')}
                                          </h5>
                                          <span
                                            className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded ${item.passed
                                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                                              }`}
                                          >
                                            {item.passed ? 'PASS' : 'FAIL'}
                                          </span>
                                        </div>
                                        <p className="text-[11px] mt-1 leading-relaxed text-zinc-300">{item.message}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
