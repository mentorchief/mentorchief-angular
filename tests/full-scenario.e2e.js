/**
 * Full logical scenario E2E tests.
 * Run with: node tests/full-scenario.e2e.js
 * Requires: ng serve (or app at http://localhost:4200)
 */
const { chromium } = require('playwright');

const BASE = 'http://localhost:4200';
const WAIT = { timeout: 10000 };
const headed = process.argv.includes('--headed');

async function run() {
  const browser = await chromium.launch({ headless: !headed, channel: headed ? 'chrome' : undefined });
  const results = { passed: 0, failed: 0, tests: [] };

  function log(name, ok, msg) {
    results.tests.push({ name, ok, msg });
    console.log(ok ? `  ✓ ${name}: ${msg}` : `  ✗ ${name}: ${msg}`);
    if (ok) results.passed++;
    else results.failed++;
  }

  try {
    // ---- 1. Public: Landing and Browse ----
    console.log('\n=== 1. Landing & Browse ===');
    const page1 = await browser.newContext().then((c) => c.newPage());
    await page1.goto(BASE, WAIT);
    const title = await page1.locator('h1').first().textContent().catch(() => '');
    log('Landing load', !!title, title ? `"${title.slice(0, 40)}..."` : 'No h1');
    await page1.goto(`${BASE}/browse`, WAIT);
    const cards = await page1.locator('a[href*="/mentor/"]').count();
    log('Browse mentors', cards > 0, `${cards} mentor links`);
    await page1.close();

    // ---- 2. Login Mentee -> Dashboard -> My Mentors ----
    console.log('\n=== 2. Mentee flow ===');
    const ctxMentee = await browser.newContext();
    const menteePage = await ctxMentee.newPage();
    await menteePage.goto(`${BASE}/login`, WAIT);
    await menteePage.locator('input[type="email"]').fill('mentee@demo.com');
    await menteePage.locator('input[type="password"]').fill('password123');
    await menteePage.locator('button[type="submit"]').click();
    await menteePage.waitForURL(/dashboard\/mentee/, WAIT);
    const menteeUrl = menteePage.url();
    log('Mentee login redirect', menteeUrl.includes('/dashboard/mentee'), menteeUrl);
    await menteePage.goto(`${BASE}/dashboard/mentee/my-mentors`, WAIT);
    const activeSection = await menteePage.locator('text=Active Mentorships').count();
    log('My Mentors page', activeSection > 0, 'Active Mentorships section visible');
    await ctxMentee.close();

    // ---- 3. Login Mentor -> Dashboard -> My Mentees ----
    console.log('\n=== 3. Mentor flow ===');
    const ctxMentor = await browser.newContext();
    const mentorPage = await ctxMentor.newPage();
    await mentorPage.goto(`${BASE}/login`, WAIT);
    await mentorPage.locator('input[type="email"]').fill('mentor@demo.com');
    await mentorPage.locator('input[type="password"]').fill('password123');
    await mentorPage.locator('button[type="submit"]').click();
    await mentorPage.waitForURL(/dashboard\/mentor/, WAIT);
    log('Mentor login redirect', mentorPage.url().includes('/dashboard/mentor'), mentorPage.url());
    await mentorPage.goto(`${BASE}/dashboard/mentor/my-mentees`, WAIT);
    const myMenteesHeading = await mentorPage.locator('h1:has-text("My Mentees")').count();
    log('My Mentees page', myMenteesHeading > 0, 'My Mentees heading visible');
    await ctxMentor.close();

    // ---- 4. Login Admin -> Mentorship Reports ----
    console.log('\n=== 4. Admin flow ===');
    const ctxAdmin = await browser.newContext();
    const adminPage = await ctxAdmin.newPage();
    await adminPage.goto(`${BASE}/login`, WAIT);
    await adminPage.locator('input[type="email"]').fill('admin@mentorchief.com');
    await adminPage.locator('input[type="password"]').fill('admin2026');
    await adminPage.locator('button[type="submit"]').click();
    await adminPage.waitForURL(/dashboard\/admin/, WAIT);
    log('Admin login redirect', adminPage.url().includes('/dashboard/admin'), adminPage.url());
    await adminPage.goto(`${BASE}/dashboard/admin/mentorship-reports`, WAIT);
    const reportsHeading = await adminPage.locator('h1:has-text("Mentorship Reports")').count();
    log('Mentorship Reports page', reportsHeading > 0, 'Mentorship Reports heading visible');
    await ctxAdmin.close();

    // ---- 5. Route guard: Mentor cannot access Mentee dashboard ----
    console.log('\n=== 5. Route guard ===');
    const ctxGuard = await browser.newContext();
    const guardPage = await ctxGuard.newPage();
    await guardPage.goto(`${BASE}/login`, WAIT);
    await guardPage.locator('input[type="email"]').fill('mentor@demo.com');
    await guardPage.locator('input[type="password"]').fill('password123');
    await guardPage.locator('button[type="submit"]').click();
    await guardPage.waitForURL(/dashboard\/mentor/, WAIT);
    await guardPage.goto(`${BASE}/dashboard/mentee`, WAIT);
    await guardPage.waitForTimeout(1500);
    const guardUrl = guardPage.url();
    const redirectedAway = !guardUrl.includes('/dashboard/mentee');
    log('Guard blocks mentee route for mentor', redirectedAway, redirectedAway ? 'Redirected to mentor dashboard' : 'Still on mentee (guard failed)');
    await ctxGuard.close();

    // ---- 6. Mentor profile: Request (mentee only) ----
    console.log('\n=== 6. Mentor profile request (mentee) ===');
    const ctxReq = await browser.newContext();
    const reqPage = await ctxReq.newPage();
    await reqPage.goto(`${BASE}/login`, WAIT);
    await reqPage.locator('input[type="email"]').fill('mentee@demo.com');
    await reqPage.locator('input[type="password"]').fill('password123');
    await reqPage.locator('button[type="submit"]').click();
    await reqPage.waitForURL(/dashboard\/mentee/, WAIT);
    await reqPage.goto(`${BASE}/mentor/1`, WAIT);
    const requestBtn = await reqPage.locator('a[href*="request"], button:has-text("Request")').first().count();
    log('Mentor profile shows request CTA for mentee', requestBtn > 0, requestBtn ? 'Request link/button found' : 'Not found');
    await ctxReq.close();

    // ---- 7. Report form route (mentor) ----
    console.log('\n=== 7. Mentor report form ===');
    const ctxReport = await browser.newContext();
    const reportPage = await ctxReport.newPage();
    await reportPage.goto(`${BASE}/login`, WAIT);
    await reportPage.locator('input[type="email"]').fill('mentor@demo.com');
    await reportPage.locator('input[type="password"]').fill('password123');
    await reportPage.locator('button[type="submit"]').click();
    await reportPage.waitForURL(/dashboard\/mentor/, WAIT);
    await reportPage.goto(`${BASE}/dashboard/mentor/report/1`, WAIT);
    await reportPage.waitForTimeout(1500);
    const reportUrl = reportPage.url();
    const onReportPage = reportUrl.includes('/report/1');
    const hasSummary = (await reportPage.getByText('Summary', { exact: false }).first().count()) > 0;
    log('Report form page loads', onReportPage && hasSummary, onReportPage ? 'Form visible' : 'Redirected or no form');
    await ctxReport.close();
  } catch (err) {
    console.error('E2E error:', err.message);
    log('E2E run', false, err.message);
  } finally {
    await browser.close();
  }

  console.log('\n=== Summary ===');
  console.log(`Passed: ${results.passed}, Failed: ${results.failed}`);
  process.exit(results.failed > 0 ? 1 : 0);
}

run();
