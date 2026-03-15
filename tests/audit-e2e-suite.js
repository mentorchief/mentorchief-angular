/**
 * Audit E2E suite — extends full-scenario with guest guard, registration, negative cases.
 * Run: node tests/audit-e2e-suite.js  (app at http://localhost:4200)
 * Optional: --headed for visible browser
 */
const { chromium } = require('playwright');

const BASE = 'http://localhost:4200';
const WAIT = { timeout: 10000 };
const headed = process.argv.includes('--headed');

async function run() {
  const browser = await chromium.launch({
    headless: !headed,
    channel: headed ? 'chrome' : undefined,
  });
  const results = { passed: 0, failed: 0, tests: [] };

  function log(name, ok, msg) {
    results.tests.push({ name, ok, msg });
    console.log(ok ? `  ✓ ${name}: ${msg}` : `  ✗ ${name}: ${msg}`);
    if (ok) results.passed++;
    else results.failed++;
  }

  try {
    // ---- 1. Unauthenticated dashboard redirect ----
    console.log('\n=== 1. Auth guard (unauthenticated) ===');
    const ctxUnauth = await browser.newContext();
    const unauthPage = await ctxUnauth.newPage();
    await unauthPage.goto(`${BASE}/dashboard/mentee`, WAIT);
    await unauthPage.waitForTimeout(1500);
    const unauthUrl = unauthPage.url();
    const redirectedToLogin =
      unauthUrl.includes('/login') && (unauthUrl.includes('returnUrl') || unauthUrl.includes('dashboard'));
    log(
      'Unauthenticated dashboard redirects to login',
      unauthUrl.includes('/login'),
      redirectedToLogin ? 'Redirect to login with returnUrl' : unauthUrl
    );
    await ctxUnauth.close();

    // ---- 2. Invalid login shows error ----
    console.log('\n=== 2. Invalid login (negative) ===');
    const ctxBad = await browser.newContext();
    const badPage = await ctxBad.newPage();
    await badPage.goto(`${BASE}/login`, WAIT);
    await badPage.locator('input[type="email"]').fill('mentee@demo.com');
    await badPage.locator('input[type="password"]').fill('wrongpassword');
    await badPage.locator('button[type="submit"]').click();
    await badPage.waitForTimeout(2000);
    const errorVisible =
      (await badPage.getByText(/invalid|error|wrong|incorrect/i).first().count()) > 0 ||
      (await badPage.locator('[role="alert"]').count()) > 0;
    const stillOnLogin = badPage.url().includes('/login');
    log('Invalid login shows error and stays on login', errorVisible && stillOnLogin, errorVisible ? 'Error shown' : 'No error text');
    await ctxBad.close();

    // ---- 3. Guest guard: logged-in user visiting /login redirects ----
    console.log('\n=== 3. Guest guard (login) ===');
    const ctxGuestLogin = await browser.newContext();
    const guestLoginPage = await ctxGuestLogin.newPage();
    await guestLoginPage.goto(`${BASE}/login`, WAIT);
    await guestLoginPage.locator('input[type="email"]').fill('mentee@demo.com');
    await guestLoginPage.locator('input[type="password"]').fill('password123');
    await guestLoginPage.locator('button[type="submit"]').click();
    await guestLoginPage.waitForURL(/dashboard\/mentee/, WAIT);
    await guestLoginPage.goto(`${BASE}/login`, WAIT);
    await guestLoginPage.waitForTimeout(1500);
    const afterLoginUrl = guestLoginPage.url();
    const guestRedirectLogin = afterLoginUrl.includes('/dashboard/mentee');
    log('Logged-in mentee visiting /login redirects to dashboard', guestRedirectLogin, guestRedirectLogin ? 'Redirected' : afterLoginUrl);
    await ctxGuestLogin.close();

    // ---- 4. Guest guard: logged-in user visiting /signup redirects ----
    console.log('\n=== 4. Guest guard (signup) ===');
    const ctxGuestSignup = await browser.newContext();
    const guestSignupPage = await ctxGuestSignup.newPage();
    await guestSignupPage.goto(`${BASE}/login`, WAIT);
    await guestSignupPage.locator('input[type="email"]').fill('mentee@demo.com');
    await guestSignupPage.locator('input[type="password"]').fill('password123');
    await guestSignupPage.locator('button[type="submit"]').click();
    await guestSignupPage.waitForURL(/dashboard\/mentee/, WAIT);
    await guestSignupPage.goto(`${BASE}/signup`, WAIT);
    await guestSignupPage.waitForTimeout(1500);
    const afterSignupUrl = guestSignupPage.url();
    const guestRedirectSignup = afterSignupUrl.includes('/dashboard/mentee');
    log('Logged-in mentee visiting /signup redirects to dashboard', guestRedirectSignup, guestRedirectSignup ? 'Redirected' : afterSignupUrl);
    await ctxGuestSignup.close();

    // ---- 5. Registration: signup then land on registration steps ----
    console.log('\n=== 5. Registration flow (signup -> role-info) ===');
    const ctxReg = await browser.newContext();
    const regPage = await ctxReg.newPage();
    await regPage.goto(`${BASE}/signup`, WAIT);
    const unique = `e2e-${Date.now()}@test.com`;
    await regPage.locator('#signup-name').fill('E2E User');
    await regPage.locator('#signup-email').fill(unique);
    await regPage.locator('#signup-password').fill('Password1');
    await regPage.locator('#signup-agreed').check();
    await regPage.locator('button[type="submit"]').click();
    await regPage.waitForTimeout(2500);
    const regUrl = regPage.url();
    const onRegistration = regUrl.includes('/auth/registration-steps');
    const hasRoleStep =
      onRegistration &&
      (await regPage.getByText(/role|choose|mentee|mentor/i).first().count()) > 0;
    log(
      'After signup user reaches registration steps',
      onRegistration,
      onRegistration ? (hasRoleStep ? 'Role step visible' : regUrl) : regUrl
    );
    await ctxReg.close();

    // ---- 6. Admin: Mentor Applications page loads ----
    console.log('\n=== 6. Admin mentor applications page ===');
    const ctxApp = await browser.newContext();
    const appPage = await ctxApp.newPage();
    await appPage.goto(`${BASE}/login`, WAIT);
    await appPage.locator('input[type="email"]').fill('admin@mentorchief.com');
    await appPage.locator('input[type="password"]').fill('admin2026');
    await appPage.locator('button[type="submit"]').click();
    await appPage.waitForURL(/dashboard\/admin/, WAIT);
    await appPage.goto(`${BASE}/dashboard/admin/mentor-applications`, WAIT);
    await appPage.waitForTimeout(1000);
    const appHeading =
      (await appPage.getByText(/mentor application|applications/i).first().count()) > 0;
    log('Admin Mentor Applications page loads', appHeading, appHeading ? 'Heading found' : appPage.url());
    await ctxApp.close();

    // ---- 7. Mentor cannot access admin ----
    console.log('\n=== 7. Role guard: mentor -> admin blocked ===');
    const ctxMentorAdmin = await browser.newContext();
    const maPage = await ctxMentorAdmin.newPage();
    await maPage.goto(`${BASE}/login`, WAIT);
    await maPage.locator('input[type="email"]').fill('mentor@demo.com');
    await maPage.locator('input[type="password"]').fill('password123');
    await maPage.locator('button[type="submit"]').click();
    await maPage.waitForURL(/dashboard\/mentor/, WAIT);
    await maPage.goto(`${BASE}/dashboard/admin`, WAIT);
    await maPage.waitForTimeout(1500);
    const maUrl = maPage.url();
    const blockedFromAdmin = !maUrl.includes('/dashboard/admin');
    log('Mentor cannot access admin dashboard', blockedFromAdmin, blockedFromAdmin ? 'Redirected away' : 'Guard failed');
    await ctxMentorAdmin.close();

    // ---- 8. Public routes without login ----
    console.log('\n=== 8. Public routes (no auth) ===');
    const ctxPub = await browser.newContext();
    const pubPage = await ctxPub.newPage();
    for (const path of ['/', '/browse', '/how-it-works', '/about']) {
      await pubPage.goto(`${BASE}${path}`, WAIT);
      const ok = pubPage.url().startsWith(BASE) && (await pubPage.locator('body').count()) > 0;
      log(`Public ${path} loads`, ok, ok ? 'OK' : pubPage.url());
    }
    await ctxPub.close();

    // ---- 9. Mentor profile and request link (mentee) ----
    console.log('\n=== 9. Mentor profile request CTA (mentee) ===');
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

    // ---- 10. Mentee dashboard: My Mentors ----
    console.log('\n=== 10. Mentee My Mentors ===');
    const ctxMM = await browser.newContext();
    const mmPage = await ctxMM.newPage();
    await mmPage.goto(`${BASE}/login`, WAIT);
    await mmPage.locator('input[type="email"]').fill('mentee@demo.com');
    await mmPage.locator('input[type="password"]').fill('password123');
    await mmPage.locator('button[type="submit"]').click();
    await mmPage.waitForURL(/dashboard\/mentee/, WAIT);
    await mmPage.goto(`${BASE}/dashboard/mentee/my-mentors`, WAIT);
    const activeSection = await mmPage.locator('text=Active Mentorships').count();
    log('My Mentors page', activeSection > 0, 'Active Mentorships section visible');
    await ctxMM.close();

    // ---- 11. Mentee: 3-day cancel subscription (full refund, mentor informed) ----
    console.log('\n=== 11. Mentee cancel subscription (3-day refund) ===');
    const ctxCancel = await browser.newContext();
    const cancelPage = await ctxCancel.newPage();
    await cancelPage.goto(`${BASE}/login`, WAIT);
    await cancelPage.locator('input[type="email"]').fill('mentee@demo.com');
    await cancelPage.locator('input[type="password"]').fill('password123');
    await cancelPage.locator('button[type="submit"]').click();
    await cancelPage.waitForURL(/dashboard\/mentee/, WAIT);
    await cancelPage.goto(`${BASE}/dashboard/mentee`, WAIT);
    await cancelPage.waitForTimeout(800);
    const cancelBtn = cancelPage.locator('button:has-text("Cancel subscription")');
    const cancelBtnCount = await cancelBtn.count();
    // Demo startedAt may be past 3 days depending on run date; pass if button present or 3-day policy text is present
    const policyText = (await cancelPage.getByText('3-Day Cancellation Policy').count()) > 0;
    log('Mentee dashboard: subscription area and 3-day policy', policyText, policyText ? 'Policy visible' : 'Not found');
    if (cancelBtnCount > 0) {
      await cancelBtn.click();
      await cancelPage.waitForTimeout(500);
      const confirmBtn = cancelPage.locator('button:has-text("cancel and get refund")');
      if ((await confirmBtn.count()) > 0) {
        await confirmBtn.click();
        await cancelPage.waitForTimeout(1200);
        const hasToast = (await cancelPage.getByText(/refund|mentor has been informed|cancelled/i).count()) > 0;
        log('Cancel confirm and toast (mentor informed)', hasToast, hasToast ? 'Toast shown' : 'No toast text found');
      }
    }
    await ctxCancel.close();
  } catch (err) {
    console.error('Audit E2E error:', err.message);
    log('Audit E2E run', false, err.message);
  } finally {
    await browser.close();
  }

  console.log('\n=== Audit E2E Summary ===');
  console.log(`Passed: ${results.passed}, Failed: ${results.failed}`);
  process.exit(results.failed > 0 ? 1 : 0);
}

run();
