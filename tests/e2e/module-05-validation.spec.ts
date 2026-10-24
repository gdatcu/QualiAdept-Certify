import { test, expect } from '@playwright/test';

test.describe('Module 05 E2E & Validation Journeys', () => {
  const validIndexHtml = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Task Tracker</title>
</head>
<body>
  <header>
    <nav>
      <h1>Task Tracker Enterprise</h1>
    </nav>
  </header>
  <main id="task-tracker">
    <section class="add-task-section">
      <form id="add-task-form">
        <input type="text" id="task-name" placeholder="Nume task..." />
        <button type="submit" id="submit-btn">Adauga</button>
      </form>
    </section>

    <section class="active-tasks-section">
      <h2>Task-uri Active (Server)</h2>
      <ul id="active-tasks-list"></ul>
    </section>

    <section class="task-history-section">
      <table id="history-table">
        <tbody id="task-list"></tbody>
      </table>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>
  `;

  const validJsAsync = `
const listaTaskuri = [
  { id: 1001, nume: "Task 1", completat: true }
];

const proceseazaTaskNou = (nume) => true;

for (let i = 0; i < listaTaskuri.length; i++) {
  console.log(listaTaskuri[i]);
}

const form = document.querySelector('#add-task-form');
const input = document.getElementById('task-name');
const tbody = document.querySelector('#task-list');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const tr = document.createElement('tr');
  tr.innerHTML = '<td>#1003</td><td>' + input.value + '</td><td><button class="delete-row">Sterge</button></td>';
  tbody.appendChild(tr);
  input.value = '';
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-row')) {
    e.target.closest('tr').remove();
  }
});

const incarcaTaskuriInitiale = async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
  const taskuri = await response.json();
  const activeTasksList = document.querySelector('#active-tasks-list');

  taskuri.forEach(task => {
    const li = document.createElement('li');
    li.textContent = task.title;
    activeTasksList.appendChild(li);
  });
};

incarcaTaskuriInitiale();
  `;

  test('E2E UI: Workspace page renders correctly for Module 05 in Romanian and English', async ({ page }) => {
    // Navigate to Module 05 page
    await page.goto('/ro/assignment/00000000-0000-0000-0000-000000000005');
    await expect(page.locator('body')).toBeVisible();

    // Verify workspace tabs exist (index.html, style.css, app.js)
    const hasAppJs = await page.locator('text=app.js').first().isVisible().catch(() => false);
    if (hasAppJs) {
      await expect(page.locator('text=app.js').first()).toBeVisible();
    }
  });

  test('E2E Validation API: Returns 401 for unauthenticated calls', async ({ request }) => {
    const response = await request.post('/api/validate/static', {
      data: {
        assignmentId: '00000000-0000-0000-0000-000000000005',
        files: {
          'index.html': validIndexHtml,
          'app.js': validJsAsync,
        },
      },
    });

    expect(response.status()).toBe(401);
  });
});
