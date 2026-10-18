import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CurriculumItem {
  moduleNumber: number;
  title: string;
  description: string;
  validationType: 'STATIC' | 'DYNAMIC';
  isPublished: boolean;
  unlockDate: Date;
  validationRules: string;
}

const curriculum: CurriculumItem[] = [
  {
    moduleNumber: 0,
    title: 'Sesiunea 0: Pregătire & Practică Platformă (Sandbox)',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-08-01T00:00:00Z'),
    description:
      'Modul de acomodare cu platforma QualiAdept. Testează editorul Monaco, verifică aserțiunile automate în timp real și trimite primul tău layout HTML pentru a te familiariza cu fluxul de validare înainte de începerea cursului.',
    validationRules: JSON.stringify([
      { type: 'tag', value: 'main', message: 'Tag-ul semantic <main> este prezent.' },
      { type: 'attr', value: 'id="practice-section"', message: 'Elementul cu id="practice-section" este prezent.' },
      { type: 'attr', value: 'data-testid="submit-btn"', message: 'Butonul cu data-testid="submit-btn" este prezent.' },
    ]),
  },
  {
    moduleNumber: 1,
    title: 'Sesiunea 1: HTML & Structura DOM',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-09-17T00:00:00Z'),
    description:
      'Construiește structura HTML (Boilerplate) cu tag-uri semantice și atribute data-testid pentru Task Tracker.',
    validationRules: JSON.stringify([
      { type: 'tag', value: 'form', message: 'Form tag is missing' },
      { type: 'attr', value: 'data-testid', message: 'Test IDs are missing' },
    ]),
  },
  {
    moduleNumber: 2,
    title: 'Sesiunea 2: CSS & DOM Selectors',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-09-24T00:00:00Z'),
    description:
      'Transformă scheletul Task Tracker-ului într-o aplicație structurată cu fișier CSS extern, navbar flexibil, rânduri tabel structurate și butoane dinamice cu stare disabled.',
    validationRules: JSON.stringify([
      {
        file: 'index.html',
        name: '[index.html] Conectare style.css în <head>',
        selector: "head link[rel='stylesheet'], link[rel='stylesheet']",
        check: 'attributeRegex',
        attrName: 'href',
        pattern: '^(?:\\.\\/)?style\\.css$',
        message: 'Cerința 1 eșuată: Nu am găsit fișierul CSS extern conectat corect în <head> (ex: <link rel="stylesheet" href="style.css">).',
      },
      {
        file: 'index.html',
        name: '[index.html] Clasa navbar pe elementul <nav>',
        selector: 'header nav',
        check: 'hasClass',
        expected: 'navbar',
        message: "Cerința 2 eșuată: Tag-ul <nav> din <header> nu are clasa 'navbar'.",
      },
      {
        file: 'index.html',
        name: '[index.html] Element logo (#logo) în navbar',
        selector: 'header nav #logo, nav #logo',
        check: 'exists',
        message: "Cerința 2 eșuată: Nu am găsit un element cu id-ul 'logo' în interiorul barei de navigație.",
      },
      {
        file: 'index.html',
        name: '[index.html] Buton login cu data-testid="btn-login"',
        selector: "header nav [data-testid='btn-login'], nav [data-testid='btn-login']",
        check: 'exists',
        message: "Cerința 2 eșuată: Lipsește butonul de login cu data-testid='btn-login' din bara de navigație.",
      },
      {
        file: 'index.html',
        name: '[index.html] Buton cu clasa delete-row în rândul 3',
        selector: 'table tbody tr:nth-child(3) button',
        check: 'hasClass',
        expected: 'delete-row',
        message: "Cerința 3 eșuată: Al treilea rând din corpul tabelului nu conține un buton cu clasa 'delete-row'.",
      },
      {
        file: 'index.html',
        name: '[index.html] Buton submit cu atributul disabled',
        selector: "button[data-testid='submit-task-btn'], [data-testid='submit-task-btn']",
        check: 'hasAttribute',
        attrName: 'disabled',
        message: "Cerința 4 eșuată: Butonul de submit (data-testid='submit-task-btn') nu are atributul 'disabled' aplicat nativ.",
      },
      {
        file: 'style.css',
        name: '[style.css] Stilizare Flexbox pentru .navbar',
        check: 'regex',
        pattern: '\\.navbar\\s*\\{[^}]*display\\s*:\\s*flex',
        message: "Cerința 2 CSS eșuată: Clasa '.navbar' din style.css trebuie să folosească 'display: flex'.",
      },
      {
        file: 'style.css',
        name: '[style.css] Selector structural tr:nth-child(3)',
        check: 'regex',
        pattern: 'tr:nth-child\\(3\\)\\s*\\{[^}]*[a-zA-Z\\-]+\\s*:',
        message: "Cerința 3 CSS eșuată: În style.css trebuie definit selectorul structural 'tr:nth-child(3)' cu reguli de stilizare.",
      },
      {
        file: 'style.css',
        name: '[style.css] Stare hover pentru butoane (:hover)',
        check: 'regex',
        pattern: '(?:button:not\\(:disabled\\):hover|button:hover)\\s*\\{[^}]*[a-zA-Z\\-]+\\s*:',
        message: "Cerința 4 CSS eșuată: În style.css trebuie definită starea de hover pentru butoane (ex: button:not(:disabled):hover) cu proprietăți de stil.",
      },
      {
        file: 'style.css',
        name: '[style.css] Stare disabled pentru butoane (:disabled)',
        check: 'regex',
        pattern: '(?:button:disabled|:disabled)\\s*\\{[^}]*[a-zA-Z\\-]+\\s*:',
        message: "Cerința 4 CSS eșuată: În style.css trebuie definită starea pentru butoane dezactivate (ex: button:disabled) cu proprietăți de stil.",
      },
    ]),
  },
  {
    moduleNumber: 3,
    title: 'Sesiunea 3: JavaScript Basics',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-10-08T00:00:00Z'),
    description:
      'Construiește logica de bază (Business Logic) a Task Tracker-ului: Array-ul de obiecte listaTaskuri, validarea strictă cu Arrow Function (proceseazaTaskNou), adăugarea prin push() și raportarea dinamică a task-urilor folosind o buclă for.',
    validationRules: JSON.stringify([
      {
        file: 'index.html',
        name: '[index.html] Conectare app.js prin tag-ul <script>',
        selector: "body script[src*='app.js'], script[src*='app.js'], script[src='app.js']",
        check: 'attributeRegex',
        attrName: 'src',
        pattern: '^(?:\\.?\\/)?app\\.js$',
        message:
          'Cerință eșuată: Fișierul app.js nu este conectat în index.html (ex: <script src="app.js"></script> înainte de </body>).',
      },
      {
        file: 'app.js',
        name: '[app.js] Declarare Array listaTaskuri cu obiecte structurate',
        check: 'regex',
        pattern: '(?:const|let|var)\\s+listaTaskuri\\s*=\\s*\\[(?=[\\s\\S]*?id\\s*:)(?=[\\s\\S]*?nume\\s*:)(?=[\\s\\S]*?completat\\s*:)[\\s\\S]*?\\]',
        message:
          'Cerința 1 eșuată: Declară constanta listaTaskuri ca Array ce conține task-uri cu proprietățile id (Number), nume (String) și completat (Boolean).',
      },
      {
        file: 'app.js',
        name: '[app.js] Arrow Function proceseazaTaskNou',
        check: 'regex',
        pattern: '(?:const|let|var)\\s+proceseazaTaskNou\\s*=\\s*\\(?\\s*[a-zA-Z0-9_$]+\\s*\\)?\\s*=>',
        message:
          'Cerința 2 eșuată: Definește funcția săgeată (Arrow Function) const proceseazaTaskNou = (taskObj) => { ... }.',
      },
      {
        file: 'app.js',
        name: '[app.js] Validare condițională if/else pentru nume lipsă sau invalid',
        check: 'regex',
        pattern: 'if\\s*\\([\\s\\S]*?(?:\\.nume|\\[[\'"]nume[\'"]\\])[\\s\\S]*?(?:===|==|!|trim|undefined|[\'"][\'"]|typeof)[\\s\\S]*?\\)',
        message:
          'Cerința 2 eșuată: Verifică în blocul if/else dacă numele task-ului lipsește ("") sau este undefined.',
      },
      {
        file: 'app.js',
        name: '[app.js] Logare mesaj de eroare pentru task invalid',
        check: 'regex',
        pattern: 'console\\.log\\s*\\(\\s*["\'`]Eroare:\\s*Task-?ul\\s+trebuie\\s+s[aă]\\s+aib[aă]\\s+un\\s+nume!?["\'`]\\s*\\)',
        message:
          'Cerința 2 eșuată: În caz de date invalide, apelează console.log("Eroare: Task-ul trebuie să aibă un nume!").',
      },
      {
        file: 'app.js',
        name: '[app.js] Adăugare în Array prin push() și mesaj de succes',
        check: 'regex',
        pattern: '(?=[\\s\\S]*?listaTaskuri\\.push\\s*\\()(?=[\\s\\S]*?console\\.log\\s*\\(\\s*["\'`]Task\\s+ad[aă]ugat\\s+cu\\s+succes!?["\'`]\\s*\\))',
        message:
          'Cerința 2 eșuată: Adaugă noul task în Array cu listaTaskuri.push(...) și afișează console.log("Task adăugat cu succes!").',
      },
      {
        file: 'app.js',
        name: '[app.js] Buclă for de parcurgere și raportare în consolă',
        check: 'regex',
        pattern: '(?:for\\s*\\(\\s*(?:let|var)\\s+[a-zA-Z0-9_$]+\\s*=\\s*0;[\\s\\S]*?listaTaskuri\\.length[\\s\\S]*?\\)|for\\s*\\(\\s*(?:const|let|var)\\s+[a-zA-Z0-9_$]+\\s+of\\s+listaTaskuri\\s*\\))[\\s\\S]*?console\\.log\\s*\\([^\\)]*?\\.nume',
        message:
          'Cerința 3 eșuată: Scrie o buclă for care parcurge array-ul listaTaskuri și afișează numele task-urilor în consolă cu console.log.',
      },
    ]),
  },
  {
    moduleNumber: 4,
    title: 'Sesiunea 4: JS DOM Manipulation',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-10-15T00:00:00Z'),
    description:
      'Interceptează formularul de adăugare și injectează noile task-uri direct ca rânduri noi în tabelul HTML, fiecare venind la pachet cu propriul buton funcțional de ștergere.',
    validationRules: JSON.stringify([
      {
        file: 'index.html',
        name: '[index.html] Conectare app.js prin tag-ul <script>',
        name_en: '[index.html] Connect app.js via <script> tag',
        selector: "body script[src*='app.js'], script[src*='app.js'], script[src='app.js']",
        check: 'attributeRegex',
        attrName: 'src',
        pattern: '^(?:\\.?\\/)?app\\.js$',
        message:
          'Cerință eșuată: Fișierul app.js nu este conectat în index.html (ex: <script src="app.js"></script> înainte de </body>).',
        message_en:
          'Requirement failed: app.js is not connected in index.html (e.g. <script src="app.js"></script> before </body>).',
        successMessage: 'Fișierul app.js este conectat corect în index.html.',
        successMessage_en: 'app.js is correctly connected in index.html.',
      },
      {
        file: 'app.js',
        name: '[app.js] Selectare elemente DOM (formular și input)',
        name_en: '[app.js] DOM Element Selection (form and input)',
        check: 'regex',
        pattern: '(?=[\\s\\S]*?(?:querySelector|getElementById)\\s*\\([\'"`]#?add-task-form[\'"`])(?=[\\s\\S]*?(?:querySelector|getElementById)\\s*\\([\'"`]#?task-name[\'"`])',
        message:
          'Cerința 1 eșuată: Selectează formularul (#add-task-form) și câmpul de text (#task-name) folosind document.querySelector(...) sau document.getElementById(...).',
        message_en:
          'Requirement 1 failed: Select the form (#add-task-form) and text input (#task-name) using document.querySelector(...) or document.getElementById(...).',
        successMessage: 'Elementele DOM (#add-task-form și #task-name) sunt selectate corect.',
        successMessage_en: 'DOM elements (#add-task-form and #task-name) are selected correctly.',
      },
      {
        file: 'app.js',
        name: '[app.js] Ascultător pentru evenimentul submit pe formular',
        name_en: '[app.js] Submit Event Listener on form',
        check: 'regex',
        pattern: '[a-zA-Z0-9_$.]+\\.addEventListener\\s*\\(\\s*[\'"`]submit[\'"`]',
        message:
          'Cerința 2 eșuată: Adaugă un ascultător de eveniment pe formular folosind addEventListener("submit", ...).',
        message_en:
          'Requirement 2 failed: Add a submit event listener to the form using addEventListener("submit", ...).',
        successMessage: 'Ascultătorul pentru evenimentul "submit" este atașat formularului.',
        successMessage_en: 'Submit event listener is attached to the form.',
      },
      {
        file: 'app.js',
        name: '[app.js] Prevenirea reîncărcării paginii cu preventDefault()',
        name_en: '[app.js] Prevent page reload with preventDefault()',
        check: 'regex',
        pattern: '(?:e|event|evt)\\.preventDefault\\s*\\(\\s*\\)',
        message:
          'Cerința 3 eșuată: Apelează e.preventDefault() în interiorul ascultătorului pentru a opri reîncărcarea nativă a paginii.',
        message_en:
          'Requirement 3 failed: Call e.preventDefault() inside the event listener to prevent native page reload.',
        successMessage: 'e.preventDefault() este apelat pentru a opri reîncărcarea paginii.',
        successMessage_en: 'e.preventDefault() is called to prevent page reload.',
      },
      {
        file: 'app.js',
        name: '[app.js] Creare dinamică a elementului de rând tr',
        name_en: '[app.js] Dynamic creation of tr row element',
        check: 'regex',
        pattern: 'document\\.createElement\\s*\\(\\s*[\'"`]tr[\'"`]\\s*\\)',
        message:
          'Cerința 4 eșuată: Creează dinamic un nou element de rând folosind document.createElement("tr").',
        message_en:
          'Requirement 4 failed: Dynamically create a new row element using document.createElement("tr").',
        successMessage: 'Elementul <tr> este creat dinamic folosind document.createElement("tr").',
        successMessage_en: 'The <tr> element is created dynamically using document.createElement("tr").',
      },
      {
        file: 'app.js',
        name: '[app.js] Structură rând cu celule și buton cu clasa delete-row',
        name_en: '[app.js] Row structure with cells and delete-row button',
        check: 'regex',
        pattern: '(?=[\\s\\S]*?\\.value)(?=[\\s\\S]*?(?:class\\s*=\\s*[\'"`][^\'"`]*\\bdelete-row\\b|classList\\.add\\s*\\(\\s*[\'"`]delete-row[\'"`]|className\\s*=\\s*[\'"`][^\'"`]*\\bdelete-row\\b))',
        message:
          'Cerința 5 eșuată: Asigură-te că rândul conține valoarea din input și include un buton cu clasa "delete-row" (ex: <button class="delete-row">Șterge</button>).',
        message_en:
          'Requirement 5 failed: Ensure the created row contains the input value and includes a delete button with class "delete-row" (e.g. <button class="delete-row">Delete</button>).',
        successMessage: 'Structura noului rând conține valoarea task-ului și butonul .delete-row.',
        successMessage_en: 'Row structure contains task text and .delete-row button.',
      },
      {
        file: 'app.js',
        name: '[app.js] Inserare rând în corpul tabelului (appendChild / append)',
        name_en: '[app.js] Insert row into table body (appendChild / append)',
        check: 'regex',
        pattern: '[a-zA-Z0-9_$.]+\\.(?:appendChild|append)\\s*\\(',
        message:
          'Cerința 6 eșuată: Adaugă noul rând generat în corpul tabelului folosind .appendChild(tr) sau .append(tr).',
        message_en:
          'Requirement 6 failed: Append the newly generated row into table body using .appendChild(tr) or .append(tr).',
        successMessage: 'Rândul nou este inserat în tabel folosind appendChild() sau append().',
        successMessage_en: 'New row is appended to the table body using appendChild() or append().',
      },
      {
        file: 'app.js',
        name: '[app.js] Resetare valoare input după salvare',
        name_en: '[app.js] Reset input value after saving',
        check: 'regex',
        pattern: '[a-zA-Z0-9_$.]+\\.value\\s*=\\s*[\'"`][\'"`]|\\.reset\\s*\\(\\s*\\)',
        message:
          'Cerința 7 eșuată: Resetează valoarea câmpului de input la un string gol (input.value = "") după salvarea task-ului.',
        message_en:
          'Requirement 7 failed: Reset the input field to an empty string (input.value = "") after saving the task.',
        successMessage: 'Câmpul de input este resetat la string gol după salvarea task-ului.',
        successMessage_en: 'Input field is reset to an empty string after saving the task.',
      },
      {
        file: 'app.js',
        name: '[app.js] Ștergere dinamică din DOM la click folosind .remove()',
        name_en: '[app.js] Dynamic DOM removal on click using .remove()',
        check: 'regex',
        pattern: '(?=[\\s\\S]*?addEventListener\\s*\\(\\s*[\'"`]click[\'"`])(?=[\\s\\S]*?(?:closest\\([\'"`]tr[\'"`]\\)|tr|rand|row|parentElement|parentNode)\\.remove\\s*\\(\\s*\\))',
        message:
          'Cerința 8 eșuată: Implementează ștergerea rândului din DOM la evenimentul de "click" apelând .remove() pe elementul părinte de tip <tr> (ex: e.target.closest("tr").remove()).',
        message_en:
          'Requirement 8 failed: Implement row removal on "click" event by calling .remove() on parent <tr> element (e.g. e.target.closest("tr").remove()).',
        successMessage: 'Ștergerea dinamică din DOM cu .remove() este implementată corect pe evenimentul de click.',
        successMessage_en: 'Dynamic DOM removal using .remove() is properly implemented on the click event.',
      },
    ]),
  },
  {
    moduleNumber: 5,
    title: 'Sesiunea 5: JS Asincron (Promises & Fetch)',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-10-22T00:00:00Z'),
    description:
      'Descarcă 5 task-uri de test de la un API public (JSONPlaceholder) folosind o Arrow Function asincronă cu await fetch, despachetează răspunsul cu .json() și injectează dinamic elementele <li> în lista activă (#active-tasks-list).',
    validationRules: JSON.stringify([
      {
        file: 'index.html',
        name: '[index.html] Elementul listă #active-tasks-list',
        name_en: '[index.html] Main list element #active-tasks-list',
        selector: '#active-tasks-list, ul#active-tasks-list, ol#active-tasks-list',
        check: 'exists',
        message:
          'Cerința eșuată: Nu am găsit lista principală în index.html (ex: <ul id="active-tasks-list"></ul>).',
        message_en:
          'Requirement failed: Main list element was not found in index.html (e.g. <ul id="active-tasks-list"></ul>).',
        successMessage: 'Lista #active-tasks-list este prezentă în index.html.',
        successMessage_en: 'The #active-tasks-list element is present in index.html.',
      },
      {
        file: 'app.js',
        name: '[app.js] Declarare Arrow Function asincronă incarcaTaskuriInitiale',
        name_en: '[app.js] Async Arrow Function declaration incarcaTaskuriInitiale',
        check: 'regex',
        pattern: '(?:const|let|var)?\\s*incarcaTaskuriInitiale\\s*=\\s*async\\s*\\(?\\s*\\)?\\s*=>',
        message:
          'Cerința 1 eșuată: Declară o Arrow Function asincronă numită incarcaTaskuriInitiale = async () => { ... }.',
        message_en:
          'Requirement 1 failed: Declare an asynchronous arrow function named incarcaTaskuriInitiale = async () => { ... }.',
        successMessage: 'Funcția asincronă incarcaTaskuriInitiale este definită corect ca Arrow Function.',
        successMessage_en: 'Asynchronous function incarcaTaskuriInitiale is correctly defined as an Arrow Function.',
      },
      {
        file: 'app.js',
        name: '[app.js] Apel Fetch API către JSONPlaceholder (_limit=5)',
        name_en: '[app.js] Fetch API call to JSONPlaceholder (_limit=5)',
        check: 'regex',
        pattern: 'await\\s+fetch\\s*\\(\\s*[\'"`]https:\\/\\/jsonplaceholder\\.typicode\\.com\\/todos\\?_limit=5[\'"`]\\s*\\)',
        message:
          'Cerința 2 eșuată: Folosește await fetch(\'https://jsonplaceholder.typicode.com/todos?_limit=5\') pentru a descărca cele 5 task-uri de test.',
        message_en:
          'Requirement 2 failed: Use await fetch(\'https://jsonplaceholder.typicode.com/todos?_limit=5\') to download the 5 test tasks.',
        successMessage: 'Apelul fetch cu limită de 5 task-uri este configurat corect cu await.',
        successMessage_en: 'Fetch call with limit=5 is correctly configured with await.',
      },
      {
        file: 'app.js',
        name: '[app.js] Despachetare răspuns JSON cu await .json()',
        name_en: '[app.js] JSON response unpacking with await .json()',
        check: 'regex',
        pattern: 'await\\s+[a-zA-Z0-9_$.]+\\.json\\s*\\(\\s*\\)',
        message:
          'Cerința 3 eșuată: Despachetează răspunsul primit apelând await response.json().',
        message_en:
          'Requirement 3 failed: Unpack received response by calling await response.json().',
        successMessage: 'Răspunsul este despachetat corect folosind await .json().',
        successMessage_en: 'Response is correctly unpacked using await .json().',
      },
      {
        file: 'app.js',
        name: '[app.js] Selectare listă #active-tasks-list din DOM',
        name_en: '[app.js] DOM selection of #active-tasks-list',
        check: 'regex',
        pattern: '(?:querySelector|getElementById)\\s*\\(\\s*[\'"`]#?active-tasks-list[\'"`]\\s*\\)',
        message:
          'Cerința 4 eșuată: Selectează lista din HTML folosind document.querySelector(\'#active-tasks-list\') sau document.getElementById(\'active-tasks-list\').',
        message_en:
          'Requirement 4 failed: Select list from HTML using document.querySelector(\'#active-tasks-list\') or document.getElementById(\'active-tasks-list\').',
        successMessage: 'Elementul #active-tasks-list este selectat corect din DOM.',
        successMessage_en: 'Element #active-tasks-list is correctly selected from DOM.',
      },
      {
        file: 'app.js',
        name: '[app.js] Parcurgere listă task-uri primite',
        name_en: '[app.js] Iterate through received tasks array',
        check: 'regex',
        pattern: '\\.(?:forEach|map)\\s*\\(|for\\s*\\(',
        message:
          'Cerința 4 eșuată: Parcurge array-ul de task-uri primit de la server folosind o buclă for sau .forEach().',
        message_en:
          'Requirement 4 failed: Iterate through the received task array using a for loop or .forEach().',
        successMessage: 'Array-ul de task-uri este parcurs corect.',
        successMessage_en: 'Task array is properly iterated.',
      },
      {
        file: 'app.js',
        name: '[app.js] Creare dinamică a elementului de listă li',
        name_en: '[app.js] Dynamic creation of li element',
        check: 'regex',
        pattern: 'document\\.createElement\\s*\\(\\s*[\'"`]li[\'"`]\\s*\\)',
        message:
          'Cerința 4 eșuată: Creează dinamic un element de listă pentru fiecare task folosind document.createElement(\'li\').',
        message_en:
          'Requirement 4 failed: Dynamically create a list item for each task using document.createElement(\'li\').',
        successMessage: 'Elementul <li> este creat dinamic folosind document.createElement(\'li\').',
        successMessage_en: 'Element <li> is dynamically created using document.createElement(\'li\').',
      },
      {
        file: 'app.js',
        name: '[app.js] Atribuire titlu task (proprietatea .title)',
        name_en: '[app.js] Set task title text (.title property)',
        check: 'regex',
        pattern: '(?=[\\s\\S]*?\\.title)(?=[\\s\\S]*?(?:\\.textContent|\\.innerText|\\.innerHTML))',
        message:
          'Cerința 4 eșuată: Setează textul elementului <li> folosind proprietatea .title a obiectului JSON primit.',
        message_en:
          'Requirement 4 failed: Set text of <li> using the .title property of the received JSON object.',
        successMessage: 'Textul elementului <li> conține proprietatea .title a task-ului.',
        successMessage_en: 'Text of <li> properly contains the .title property.',
      },
      {
        file: 'app.js',
        name: '[app.js] Inserare li în listă (appendChild / append)',
        name_en: '[app.js] Append li to active-tasks-list',
        check: 'regex',
        pattern: '[a-zA-Z0-9_$.]+\\.(?:appendChild|append)\\s*\\(\\s*(?:li|[a-zA-Z0-9_$]+)\\s*\\)',
        message:
          'Cerința 4 eșuată: Adaugă elementul <li> generat în lista #active-tasks-list folosind .appendChild(li) sau .append(li).',
        message_en:
          'Requirement 4 failed: Append the generated <li> element into #active-tasks-list using .appendChild(li) or .append(li).',
        successMessage: 'Elementul <li> este inserat în lista din DOM.',
        successMessage_en: 'Element <li> is appended into the DOM list.',
      },
      {
        file: 'app.js',
        name: '[app.js] Apelare funcție la încărcare: incarcaTaskuriInitiale()',
        name_en: '[app.js] Automatic function call: incarcaTaskuriInitiale()',
        check: 'regex',
        pattern: '(?<!function\\s+|const\\s+|let\\s+|var\\s+)incarcaTaskuriInitiale\\s*\\(\\s*\\)',
        message:
          'Cerința 5 eșuată: Apelează funcția incarcaTaskuriInitiale(); la finalul fișierului app.js pentru a o declanșa automat.',
        message_en:
          'Requirement 5 failed: Call the function incarcaTaskuriInitiale(); at the end of app.js to trigger it automatically.',
        successMessage: 'Funcția incarcaTaskuriInitiale() este apelată automat la încărcarea paginii.',
        successMessage_en: 'Function incarcaTaskuriInitiale() is called automatically on load.',
      },
    ]),
  },
  {
    moduleNumber: 6,
    title: 'Sesiunea 6: Kanban Workshop',
    validationType: 'DYNAMIC',
    isPublished: true,
    unlockDate: new Date('2026-10-29T00:00:00Z'),
    description:
      'Finalizează logica panoului Kanban. Această aplicație va fi subiectul testelor noastre E2E.',
    validationRules: JSON.stringify([]),
  },
  {
    moduleNumber: 7,
    title: 'Sesiunea 7: Trecerea la TypeScript',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-11-05T00:00:00Z'),
    description: 'Tipizarea statică, primitive, any, void și tsconfig.json.',
    validationRules: JSON.stringify([
      { type: 'regex', value: ':\\s*(string|number|void)', message: 'Adaugă tipuri explicite TypeScript' },
    ]),
  },
  {
    moduleNumber: 8,
    title: 'Sesiunea 8: Interfețe și Clase TS',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-11-12T00:00:00Z'),
    description: 'Structuri avansate în TS. Refactorizează codul folosind Interfețe și OOP.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'interface|class', message: 'Definește interfețele pentru Task-uri' },
    ]),
  },
  {
    moduleNumber: 9,
    title: 'Sesiunea 9: Playwright Setup & Codegen',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-11-19T00:00:00Z'),
    description: 'Configurare playwright.config.ts și generarea primului test via CLI.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'test\\(|import.*test', message: 'Structura testului Playwright lipsește' },
    ]),
  },
  {
    moduleNumber: 10,
    title: 'Sesiunea 10: Primul Test E2E Manual',
    validationType: 'DYNAMIC',
    isPublished: true,
    unlockDate: new Date('2026-11-26T00:00:00Z'),
    description: 'Scrie acțiuni de bază: page.goto, fill, click, select.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'page\\.(goto|fill|click)', message: 'Folosește metodele page' },
    ]),
  },
  {
    moduleNumber: 11,
    title: 'Sesiunea 11: Filosofia Localizatorilor',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-12-03T00:00:00Z'),
    description: 'Evită selectoarele fragile. Folosește getByRole, getByText, getByTestId.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'getByRole|getByTestId', message: 'Aplică noile strategii de localizare' },
    ]),
  },
  {
    moduleNumber: 12,
    title: 'Sesiunea 12: Web-First Assertions',
    validationType: 'DYNAMIC',
    isPublished: true,
    unlockDate: new Date('2026-12-10T00:00:00Z'),
    description:
      "Manipulează validările de stare cu funcția 'expect'. Asertări pentru vizibilitate și conținut.",
    validationRules: JSON.stringify([
      { type: 'regex', value: 'expect\\(.*\\)\\.to', message: 'Lipsesc asertările web-first' },
    ]),
  },
  {
    moduleNumber: 13,
    title: 'Sesiunea 13: Page Object Model (POM)',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-12-17T00:00:00Z'),
    description:
      'Structurarea framework-ului pentru scalabilitate. Creează clase de pagină în TypeScript.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'class.*Page', message: 'Trebuie să exporți o clasă pentru pagină' },
    ]),
  },
  {
    moduleNumber: 14,
    title: 'Sesiunea 14: Custom Fixtures & Data-Driven',
    validationType: 'DYNAMIC',
    isPublished: true,
    unlockDate: new Date('2027-01-07T00:00:00Z'),
    description: 'Construiește fixtures și rulează teste folosind parametri din JSON.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'test\\.extend', message: 'Extinde testele folosind fixtures' },
    ]),
  },
  {
    moduleNumber: 15,
    title: 'Sesiunea 15: Global Auth State',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2027-01-14T00:00:00Z'),
    description: 'Salvează sesiunea (storageState) pentru autentificare unică și rapidă.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'storageState', message: 'Lipseste definirea storageState' },
    ]),
  },
  {
    moduleNumber: 16,
    title: 'Sesiunea 16: API Mocking',
    validationType: 'DYNAMIC',
    isPublished: true,
    unlockDate: new Date('2027-01-21T00:00:00Z'),
    description: 'Interceptarea rețelei. Testează interfața simulând erori de backend 500.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'page\\.route', message: 'Trebuie să folosești page.route pentru mocking' },
    ]),
  },
  {
    moduleNumber: 17,
    title: 'Sesiunea 17: Reports & Debugging',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2027-01-28T00:00:00Z'),
    description: 'Configurarea Trace Viewer, video la eșec și retry-uri pentru flaky tests.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'trace:|retries:', message: 'Configurațiile pentru debug sunt incomplete' },
    ]),
  },
  {
    moduleNumber: 18,
    title: 'Sesiunea 18: Git & GitHub Actions (YAML)',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2027-02-04T00:00:00Z'),
    description: 'Scrierea pipeline-ului CI/CD. Sintaxa YAML și declanșatori (on: push).',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'on:\\s*push|jobs:', message: 'Sintaxa fișierului workflow este incorectă' },
    ]),
  },
  {
    moduleNumber: 19,
    title: 'Sesiunea 19: CI/CD Pipeline Execution',
    validationType: 'DYNAMIC',
    isPublished: true,
    unlockDate: new Date('2027-02-11T00:00:00Z'),
    description: 'Rulează containere Ubuntu headless și validează integrarea continuă.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'runs-on:|npx playwright', message: 'Lipsește comanda de execuție a testelor' },
    ]),
  },
  {
    moduleNumber: 20,
    title: 'Sesiunea 20: Final Demo Day & Review',
    validationType: 'DYNAMIC',
    isPublished: true,
    unlockDate: new Date('2027-02-18T00:00:00Z'),
    description: 'Rularea suitei finale și obținerea scorului maxim pentru certificare.',
    validationRules: JSON.stringify([]),
  },
];

async function main() {
  console.log('🌱 Starting database seed (Deterministic Stable IDs)...');

  console.log('📚 Upserting 20-week curriculum modules into database...');

  for (const item of curriculum) {
    const existing = await prisma.assignment.findFirst({
      where: { module: item.moduleNumber },
    });

    const assignmentId = existing
      ? existing.id
      : `00000000-0000-0000-0000-${item.moduleNumber.toString().padStart(12, '0')}`;

    const upsertedAssignment = await prisma.assignment.upsert({
      where: { id: assignmentId },
      update: {
        module: item.moduleNumber,
        title: item.title,
        description: item.description,
        validationType: item.validationType,
        isPublished: item.isPublished,
        isActive: true,
        unlockDate: item.unlockDate,
        validationRules: item.validationRules,
      },
      create: {
        id: assignmentId,
        module: item.moduleNumber,
        title: item.title,
        description: item.description,
        validationType: item.validationType,
        isPublished: item.isPublished,
        isActive: true,
        unlockDate: item.unlockDate,
        validationRules: item.validationRules,
      },
    });

    console.log(
      `   [✓] Module ${upsertedAssignment.module.toString().padStart(2, ' ')}: "${upsertedAssignment.title}" (${upsertedAssignment.validationType}) - ID: ${upsertedAssignment.id}`
    );
  }

  console.log('✨ Curriculum upserted successfully: 21 Modules synchronized.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
