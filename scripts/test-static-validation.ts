import { prisma } from '../src/lib/prisma';
import * as cheerio from 'cheerio';

async function runTest() {
  console.log('--- Testing Static Validation Engine Logic ---');

  const sampleHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Task Tracker Test</title>
    </head>
    <body>
      <main>
        <section id="add-task-section">
          <h2>Add New Task</h2>
          <button data-testid="submit-btn">Add Task</button>
        </section>
      </main>
    </body>
    </html>
  `;

  // Parse HTML
  const $ = cheerio.load(sampleHtml);

  const checks = [
    {
      check: 'Main tag exists',
      passed: $('main').length > 0,
      message: $('main').length > 0 ? 'Semantic <main> tag is present.' : 'Missing <main> tag.',
    },
    {
      check: 'Add task section exists',
      passed: $('#add-task-section').length > 0,
      message: $('#add-task-section').length > 0 ? 'Element with id="add-task-section" is present.' : 'Missing element with id="add-task-section".',
    },
    {
      check: 'Submit button exists',
      passed: $('button[data-testid="submit-btn"]').length > 0,
      message: $('button[data-testid="submit-btn"]').length > 0 ? 'Button with data-testid="submit-btn" is present.' : 'Missing button element with data-testid="submit-btn".',
    },
  ];

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const status = score === 100 ? 'pass' : 'fail';
  const dbStatus = score === 100 ? 'PASS' : 'FAIL';

  const feedbackPayload = {
    status,
    score,
    feedback: checks,
  };

  console.log('Validation Output JSON:', JSON.stringify(feedbackPayload, null, 2));

  // Test Database connectivity and submission insertion
  console.log('Testing Prisma Database insertion...');
  const testUserId = 'test-student-001';
  const testAssignmentId = 'assignment-session-1';

  await prisma.user.upsert({
    where: { id: testUserId },
    update: {},
    create: {
      id: testUserId,
      email: 'student001@qualiadept.eu',
      name: 'Test Student 001',
      role: 'STUDENT',
    },
  });

  await prisma.assignment.upsert({
    where: { id: testAssignmentId },
    update: {},
    create: {
      id: testAssignmentId,
      title: 'Session 1: Task Tracker',
      description: 'Static HTML Validation',
      module: 1,
      validationType: 'STATIC',
      isActive: true,
    },
  });

  const submission = await prisma.submission.create({
    data: {
      userId: testUserId,
      assignmentId: testAssignmentId,
      codePayload: sampleHtml,
      status: dbStatus,
      score,
      feedbackJSON: JSON.stringify(feedbackPayload),
    },
  });

  console.log('Saved Submission to Database successfully! Record ID:', submission.id);

  // Clean up test submission record
  await prisma.submission.delete({ where: { id: submission.id } });
  console.log('Cleaned up test submission record.');

  await prisma.$disconnect();
  console.log('--- Test Complete: SUCCESS ---');
}

runTest().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
