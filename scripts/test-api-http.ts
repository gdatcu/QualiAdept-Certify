async function runHttpTests() {
  const baseUrl = 'http://127.0.0.1:3000/api/validate/static';
  console.log(`Starting HTTP manual tests against ${baseUrl}...\n`);

  // Test Case 1: Full Pass (100%)
  console.log('--- Test Case 1: Full Pass (100% Score) ---');
  const passPayload = {
    userId: 'user-http-pass',
    assignmentId: 'assignment-session-1',
    htmlCode: `
      <!DOCTYPE html>
      <html>
        <body>
          <main>
            <section id="add-task-section">
              <button data-testid="submit-btn">Add Task</button>
            </section>
          </main>
        </body>
      </html>
    `,
  };

  const res1 = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(passPayload),
  });

  console.log(`HTTP Status: ${res1.status}`);
  console.log('Response Body:', await res1.json());
  console.log('\n');

  // Test Case 2: Partial Fail (67%)
  console.log('--- Test Case 2: Partial Fail (67% Score) ---');
  const partialPayload = {
    userId: 'user-http-partial',
    assignmentId: 'assignment-session-1',
    htmlCode: `
      <!DOCTYPE html>
      <html>
        <body>
          <main>
            <section id="add-task-section">
              <p>Missing submit button</p>
            </section>
          </main>
        </body>
      </html>
    `,
  };

  const res2 = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partialPayload),
  });

  console.log(`HTTP Status: ${res2.status}`);
  console.log('Response Body:', await res2.json());
  console.log('\n');

  // Test Case 3: Total Fail (0%)
  console.log('--- Test Case 3: Total Fail (0% Score) ---');
  const failPayload = {
    userId: 'user-http-fail',
    assignmentId: 'assignment-session-1',
    htmlCode: `<div>No main, no section, no button</div>`,
  };

  const res3 = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(failPayload),
  });

  console.log(`HTTP Status: ${res3.status}`);
  console.log('Response Body:', await res3.json());
  console.log('\n');

  // Test Case 4: Invalid Request (400 Bad Request)
  console.log('--- Test Case 4: Invalid Payload (Missing htmlCode) ---');
  const invalidPayload = {
    userId: 'user-http-invalid',
    assignmentId: 'assignment-session-1',
  };

  const res4 = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidPayload),
  });

  console.log(`HTTP Status: ${res4.status}`);
  console.log('Response Body:', await res4.json());
  console.log('\n');

  console.log('=== All HTTP API Tests Completed Successfully ===');
}

runHttpTests().catch((err) => {
  console.error('HTTP Test Failed:', err);
  process.exit(1);
});
