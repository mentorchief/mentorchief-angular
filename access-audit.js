const { chromium } = require('playwright');

const BASE = 'http://localhost:4200';
const SUPABASE_URL = 'https://dygsretgyxeyfvznvapx.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5Z3NyZXRneXhleWZ2em52YXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODUwMjgsImV4cCI6MjA4OTE2MTAyOH0.NODro7CNGhJHKLeBDzZ6DiJda3ROubTpGZ9Sdxxaoes';
const STORAGE_KEY = 'sb-dygsretgyxeyfvznvapx-auth-token';

const USERS = {
  guest:           { email: null },
  mentee:          { email: 'test.mentee@mentorchief.dev',          password: 'Test1234!' },
  mentor_pending:  { email: 'test.mentor.pending@mentorchief.dev',  password: 'Test1234!' },
  mentor_approved: { email: 'test.mentor.approved@mentorchief.dev', password: 'Test1234!' },
  mentor_rejected: { email: 'test.mentor.rejected@mentorchief.dev', password: 'Test1234!' },
  admin:           { email: 'test.admin@mentorchief.dev',           password: 'Test1234!' },
  unregistered:    { email: 'test.unregistered@mentorchief.dev',    password: 'Test1234!' },
  suspended:       { email: 'test.suspended@mentorchief.dev',       password: 'Test1234!' },
};

const ROUTES = [
  '/', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email',
  '/browse', '/how-it-works', '/about', '/help', '/terms', '/privacy', '/blog',
  '/mentor/abc123', '/mentor/abc123/reviews', '/mentor/abc123/request',
  '/auth/registration-steps',
  '/auth/registration-steps/role-info',
  '/auth/registration-steps/personal-info',
  '/auth/registration-steps/career-info',
  '/auth/registration-steps/biography',
  '/auth/registration-steps/preference',
  '/auth/registration-steps/preview',
  '/dashboard/mentee', '/dashboard/mentee/my-mentors', '/dashboard/mentee/messages',
  '/dashboard/mentee/payments', '/dashboard/mentee/reports', '/dashboard/mentee/settings',
  '/dashboard/mentor', '/dashboard/mentor/pending', '/dashboard/mentor/rejected',
  '/dashboard/mentor/my-mentees', '/dashboard/mentor/messages',
  '/dashboard/mentor/earnings', '/dashboard/mentor/reports', '/dashboard/mentor/settings',
  '/dashboard/admin', '/dashboard/admin/users', '/dashboard/admin/mentor-applications',
  '/dashboard/admin/payments', '/dashboard/admin/messages',
  '/dashboard/admin/reports', '/dashboard/admin/mentorship-reports', '/dashboard/admin/settings',
  '/nonexistent-page',
];

async function setupSession(context, email, password) {
  const page = await context.newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });

  if (!email) { await page.close(); return { ok: true }; }

  const result = await page.evaluate(async ({ supabaseUrl, anonKey, email, password, storageKey }) => {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.access_token) {
        localStorage.setItem(storageKey, JSON.stringify({
          access_token: json.access_token,
          refresh_token: json.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + json.expires_in,
          token_type: 'bearer',
          user: json.user,
        }));
        return { ok: true };
      }
      return { ok: false, error: json.error_description || json.msg || JSON.stringify(json) };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, { supabaseUrl: SUPABASE_URL, anonKey: ANON_KEY, email, password, storageKey: STORAGE_KEY });

  await page.close();
  return result;
}

async function testRoute(context, route) {
  const page = await context.newPage();
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.waitForTimeout(1500);
    const url = new URL(page.url());
    const landed = url.pathname + url.search;
    await page.close();
    return landed;
  } catch (e) {
    try { await page.close(); } catch (_) {}
    return `ERROR: ${e.message.slice(0, 80)}`;
  }
}

function printResults(userName, results) {
  console.log(`\n${'='.repeat(72)}`);
  console.log(`👤  ${userName.toUpperCase()}`);
  console.log('='.repeat(72));
  for (const { route, landed } of results) {
    const isError = landed.startsWith('ERROR');
    const changed = landed.replace(/\?.*/, '') !== route;
    const icon = isError ? '💥' : changed ? '↪️ ' : '✅';
    const extra = changed ? ` → ${landed}` : '';
    console.log(`  ${icon}  ${route}${extra}`);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const [userName, creds] of Object.entries(USERS)) {
    process.stdout.write(`\nTesting ${userName}... `);
    const context = await browser.newContext();

    const loginResult = await setupSession(context, creds.email, creds.password);
    if (!loginResult.ok) {
      console.log(`LOGIN FAILED: ${loginResult.error}`);
      await context.close();
      continue;
    }

    if (creds.email) {
      const warmUp = await context.newPage();
      try {
        await warmUp.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 10000 });
        await warmUp.waitForTimeout(2000);
      } catch (_) {}
      await warmUp.close();
    }

    console.log('logged in');

    const results = [];
    for (const route of ROUTES) {
      const landed = await testRoute(context, route);
      results.push({ route, landed });
    }

    printResults(userName, results);
    await context.close();
  }

  await browser.close();
  console.log('\n\nAUDIT COMPLETE\n');
})();
