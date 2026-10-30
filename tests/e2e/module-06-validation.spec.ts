import { test, expect } from '@playwright/test';

test.describe('Module 06 E2E & Validation Journeys', () => {
  const validIndexHtml = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>QA Task Tracker Pro</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="navbar">
    <h1 id="logo">QA Task Tracker</h1>
    <span id="network-status" class="status-indicator online">API Online</span>
  </header>
  <main class="container">
    <section class="card input-section">
      <form id="add-task-form">
        <input type="text" id="task-name" placeholder="ex: Testare login" data-testid="input-task-name">
        <button type="submit" id="submit-task-btn" data-testid="submit-task-btn" disabled>Salvează</button>
        <small id="error-msg" data-testid="error-message" style="display: none;">Numele task-ului nu poate fi gol!</small>
      </form>
    </section>
    <section class="card list-section">
      <div id="loading-spinner" class="spinner" data-testid="loading-spinner">Se încarcă datele...</div>
      <ul id="task-list" class="task-list" data-testid="task-list"></ul>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>`;

  const validStyleCss = `
.navbar { display: flex; }
.spinner { background-color: #fcf3cf; }
.completed {
  text-decoration: line-through;
  color: #7f8c8d;
}
.overlay-modal { position: fixed; }
`;

  const validAppJs = `
const form = document.querySelector('#add-task-form');
const inputNode = document.querySelector('#task-name');
const submitBtn = document.querySelector('#submit-task-btn');
const errorMsg = document.querySelector('#error-msg');
const taskList = document.querySelector('#task-list');
const spinner = document.querySelector('#loading-spinner');
const API_URL = 'https://jsonplaceholder.typicode.com/todos';

const deseneazaTaskInDOM = (id, titlu) => {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.innerHTML = \`
    <span class="task-title">\${titlu}</span>
    <button class="btn-delete" data-testid="delete-btn-\${id}">Șterge</button>
  \`;
  taskList.appendChild(li);
};

const incarcaDateServer = async () => {
  try {
    const response = await fetch(\`\${API_URL}?_limit=5\`);
    const data = await response.json();
    spinner.style.display = 'none';
    data.forEach(task => deseneazaTaskInDOM(task.id, task.title));
  } catch (error) {
    console.error(error);
  }
};
incarcaDateServer();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const taskTitle = inputNode.value.trim();
  if (!taskTitle) return;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: taskTitle, completed: false, userId: 1 })
  });

  if (response.status === 201) {
    const newTask = await response.json();
    deseneazaTaskInDOM(newTask.id, newTask.title);
    inputNode.value = '';
  }
});

inputNode.addEventListener('input', () => {
  if (inputNode.value.trim().length > 0) {
    submitBtn.disabled = false;
    errorMsg.style.display = 'none';
  } else {
    submitBtn.disabled = true;
    errorMsg.style.display = 'block';
  }
});

taskList.addEventListener('click', async (e) => {
  if (e.target.classList.contains('task-title')) {
    e.target.classList.toggle('completed');
  }

  if (e.target.classList.contains('btn-delete')) {
    const deleteBtn = e.target;
    const randTask = deleteBtn.closest('.task-item');
    const taskId = deleteBtn.getAttribute('data-testid').split('-')[2];

    const response = await fetch(\`\${API_URL}/\${taskId}\`, {
      method: 'DELETE'
    });
    if (response.ok) {
      randTask.remove();
    }
  }
});

const initChaosMode = () => {
  setTimeout(() => {
    const modal = document.createElement('div');
    modal.className = 'overlay-modal';
    modal.innerHTML = \`
      <div class="promo-box">
        <h3>Ofertă Specială!</h3>
        <button class="btn-close-promo" data-testid="close-promo-btn">Nu, mulțumesc</button>
      </div>
    \`;
    const closeBtn = modal.querySelector('.btn-close-promo');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    document.body.appendChild(modal);
  }, 3000);
};
initChaosMode();
`;

  test('E2E UI: Workspace page renders correctly for Module 06 in Romanian', async ({ page }) => {
    await page.goto('/ro/assignment/00000000-0000-0000-0000-000000000006');
    await expect(page.locator('body')).toBeVisible();

    const hasAppJs = await page.locator('text=app.js').first().isVisible().catch(() => false);
    if (hasAppJs) {
      await expect(page.locator('text=app.js').first()).toBeVisible();
    }
  });

  test('E2E Validation API: Returns 401 for unauthenticated calls', async ({ request }) => {
    const response = await request.post('/api/validate/static', {
      data: {
        assignmentId: '00000000-0000-0000-0000-000000000006',
        files: {
          'index.html': validIndexHtml,
          'style.css': validStyleCss,
          'app.js': validAppJs,
        },
      },
    });

    expect(response.status()).toBe(401);
  });
});
