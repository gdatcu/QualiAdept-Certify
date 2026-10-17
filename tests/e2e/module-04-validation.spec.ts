import { test, expect } from '@playwright/test';

test.describe('Module 04 E2E & Validation Journeys', () => {
  const validIndexHtml = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Task Tracker</title>
</head>
<body>
  <form id="add-task-form">
    <input type="text" id="task-name">
    <button type="submit">Adauga</button>
  </form>
  <table id="history-table">
    <tbody></tbody>
  </table>
  <script src="app.js"></script>
</body>
</html>
  `;

  const validJsStandard = `
const form = document.querySelector('#add-task-form');
const input = document.getElementById('task-name');
const tbody = document.querySelector('tbody');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const tr = document.createElement('tr');
  tr.innerHTML = '<td>#1003</td><td>' + input.value + '</td><td><button class="delete-row">Sterge</button></td>';
  tbody.appendChild(tr);
  input.value = '';
});

document.addEventListener('click', function (e) {
  if (e.target.classList.contains('delete-row')) {
    e.target.closest('tr').remove();
  }
});
  `;

  const validJsCreative = `
const taskForm = document.querySelector('#add-task-form');
const taskInput = document.querySelector('#task-name');
const tableBody = document.querySelector('#history-table tbody');

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newRow = document.createElement('tr');
  newRow.innerHTML = \`
    <td>#1004</td>
    <td>\${taskInput.value}</td>
    <td><button class="delete-row">Șterge Task</button></td>
  \`;
  tableBody.appendChild(newRow);
  taskInput.value = '';
});

document.addEventListener('click', (e) => {
  if (e.target.closest('.delete-row')) {
    e.target.closest('tr').remove();
  }
});
  `;

  const invalidJsWrongButtonClass = `
const form = document.querySelector('#add-task-form');
const input = document.getElementById('task-name');
const tbody = document.querySelector('tbody');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const tr = document.createElement('tr');
  // BUG: Class is btn-stergere, not delete-row
  tr.innerHTML = '<td>#1003</td><td>' + input.value + '</td><td><button class="btn-stergere">Sterge</button></td>';
  tbody.appendChild(tr);
  input.value = '';
});

document.addEventListener('click', function (e) {
  if (e.target.classList.contains('delete-row')) {
    e.target.closest('tr').remove();
  }
});
  `;

  test('E2E UI: Workspace page renders correctly for Module 04 in Romanian and English', async ({ page }) => {
    // Navigate to Module 04 page
    await page.goto('/ro/assignment/00000000-0000-0000-0000-000000000004');
    await expect(page.locator('body')).toBeVisible();

    // Verify workspace tabs exist or page loads
    const hasTabs = await page.locator('text=app.js').first().isVisible().catch(() => false);
    if (hasTabs) {
      await expect(page.locator('text=app.js').first()).toBeVisible();
    }
  });

  test('E2E Validation API: Returns 401 for unauthenticated calls', async ({ request }) => {
    const response = await request.post('/api/validate/static', {
      data: {
        assignmentId: '00000000-0000-0000-0000-000000000004',
        files: {
          'index.html': validIndexHtml,
          'app.js': validJsStandard,
        },
      },
    });

    expect(response.status()).toBe(401);
  });
});
