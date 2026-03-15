const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = 'verification-screenshots';
const BASE_URL = 'http://localhost:4200';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0, warnings: 0 }
};

function addResult(section, test, status, message, details = null) {
  const result = { section, test, status, message };
  if (details) result.details = details;
  results.tests.push(result);
  
  if (status === 'PASS') results.summary.passed++;
  else if (status === 'FAIL') results.summary.failed++;
  else if (status === 'WARN') results.summary.warnings++;
  
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  console.log(`${icon} [${section}] ${test}: ${message}`);
  if (details) console.log(`  Details: ${JSON.stringify(details, null, 2)}`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyLandingPage(page) {
  console.log('\n=== 1. LANDING PAGE VERIFICATION ===');
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-landing-page.png'), fullPage: true });
    addResult('Landing Page', 'Page Load', 'PASS', 'Landing page loaded successfully');
  } catch (error) {
    addResult('Landing Page', 'Page Load', 'FAIL', `Failed to load: ${error.message}`);
    return;
  }

  // Check fonts
  try {
    const fontFamily = await page.evaluate(() => {
      const hero = document.querySelector('h1, .hero h1, [class*="hero"] h1');
      if (hero) {
        return window.getComputedStyle(hero).fontFamily;
      }
      return null;
    });
    
    if (fontFamily && fontFamily.toLowerCase().includes('playfair')) {
      addResult('Landing Page', 'Typography', 'PASS', `Playfair Display font detected: ${fontFamily}`);
    } else {
      addResult('Landing Page', 'Typography', 'WARN', `Expected Playfair Display, got: ${fontFamily}`);
    }
  } catch (error) {
    addResult('Landing Page', 'Typography', 'FAIL', `Font check failed: ${error.message}`);
  }

  // Check primary color
  try {
    const primaryColor = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, .btn, [class*="button"]');
      for (const btn of buttons) {
        const bgColor = window.getComputedStyle(btn).backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          return bgColor;
        }
      }
      return null;
    });
    
    if (primaryColor) {
      addResult('Landing Page', 'Primary Color', 'PASS', `Primary color found: ${primaryColor}`);
    } else {
      addResult('Landing Page', 'Primary Color', 'WARN', 'Could not verify primary color #3730a3');
    }
  } catch (error) {
    addResult('Landing Page', 'Primary Color', 'FAIL', `Color check failed: ${error.message}`);
  }

  // Check navbar
  try {
    const navbar = await page.evaluate(() => {
      const nav = document.querySelector('nav, [role="navigation"], header nav');
      if (!nav) return { exists: false };
      
      const hasLogo = !!nav.querySelector('img, svg, [class*="logo"]');
      const links = Array.from(nav.querySelectorAll('a')).map(a => a.textContent.trim());
      const hasGetStarted = !!nav.querySelector('button, a[href*="signup"], a[href*="register"]');
      
      return { exists: true, hasLogo, links, hasGetStarted };
    });
    
    if (navbar.exists) {
      addResult('Landing Page', 'Navbar', 'PASS', 'Navbar found', navbar);
    } else {
      addResult('Landing Page', 'Navbar', 'FAIL', 'Navbar not found');
    }
  } catch (error) {
    addResult('Landing Page', 'Navbar', 'FAIL', `Navbar check failed: ${error.message}`);
  }

  // Check sections
  const sections = ['hero', 'features', 'mentors', 'testimonials', 'footer'];
  for (const section of sections) {
    try {
      const found = await page.evaluate((sec) => {
        const selectors = [
          `[class*="${sec}"]`,
          `#${sec}`,
          `section[class*="${sec}"]`,
          `div[class*="${sec}"]`
        ];
        
        for (const selector of selectors) {
          if (document.querySelector(selector)) return true;
        }
        
        // Special case for footer
        if (sec === 'footer' && document.querySelector('footer')) return true;
        
        return false;
      }, section);
      
      if (found) {
        addResult('Landing Page', `${section} Section`, 'PASS', `${section} section found`);
      } else {
        addResult('Landing Page', `${section} Section`, 'WARN', `${section} section not clearly identified`);
      }
    } catch (error) {
      addResult('Landing Page', `${section} Section`, 'FAIL', `Section check failed: ${error.message}`);
    }
  }
}

async function verifyBrowseMentors(page) {
  console.log('\n=== 2. BROWSE MENTORS VERIFICATION ===');
  
  try {
    await page.goto(`${BASE_URL}/browse`, { waitUntil: 'networkidle', timeout: 10000 });
    await delay(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-browse-mentors.png'), fullPage: true });
    addResult('Browse Mentors', 'Page Load', 'PASS', 'Browse page loaded successfully');
  } catch (error) {
    addResult('Browse Mentors', 'Page Load', 'FAIL', `Failed to load: ${error.message}`);
    return;
  }

  // Check mentor cards
  try {
    const mentorCards = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="mentor"], [class*="card"]');
      const cardData = [];
      
      for (const card of cards) {
        const hasImage = !!card.querySelector('img');
        const hasName = !!card.querySelector('[class*="name"], h2, h3, h4');
        const hasRating = !!card.querySelector('[class*="rating"], [class*="star"]');
        const hasPrice = card.textContent.match(/\$\d+/) !== null;
        
        if (hasImage || hasName) {
          cardData.push({ hasImage, hasName, hasRating, hasPrice });
        }
      }
      
      return { count: cardData.length, cards: cardData.slice(0, 3) };
    });
    
    if (mentorCards.count > 0) {
      addResult('Browse Mentors', 'Mentor Cards', 'PASS', `Found ${mentorCards.count} mentor cards`, mentorCards);
    } else {
      addResult('Browse Mentors', 'Mentor Cards', 'FAIL', 'No mentor cards found');
    }
  } catch (error) {
    addResult('Browse Mentors', 'Mentor Cards', 'FAIL', `Card check failed: ${error.message}`);
  }

  // Check filters
  try {
    const filters = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"], input[type="search"]');
      const selects = document.querySelectorAll('select');
      
      return {
        searchInputs: inputs.length,
        dropdowns: selects.length,
        totalFilters: inputs.length + selects.length
      };
    });
    
    if (filters.totalFilters > 0) {
      addResult('Browse Mentors', 'Filters', 'PASS', `Found ${filters.totalFilters} filter controls`, filters);
    } else {
      addResult('Browse Mentors', 'Filters', 'WARN', 'No filter controls found');
    }
  } catch (error) {
    addResult('Browse Mentors', 'Filters', 'FAIL', `Filter check failed: ${error.message}`);
  }
}

async function verifyLoginFlow(page) {
  console.log('\n=== 3. LOGIN TEST ===');
  
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 10000 });
    await delay(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-login-page.png') });
    addResult('Login', 'Page Load', 'PASS', 'Login page loaded successfully');
  } catch (error) {
    addResult('Login', 'Page Load', 'FAIL', `Failed to load: ${error.message}`);
    return;
  }

  // Fill login form
  try {
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[id*="email"]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
    
    await emailInput.fill('mentor@demo.com');
    await passwordInput.fill('password123');
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-login-filled.png') });
    addResult('Login', 'Form Fill', 'PASS', 'Login form filled successfully');
  } catch (error) {
    addResult('Login', 'Form Fill', 'FAIL', `Failed to fill form: ${error.message}`);
    return;
  }

  // Submit form
  try {
    const submitButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await submitButton.click();
    await delay(2000);
    
    const currentUrl = page.url();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-after-login.png'), fullPage: true });
    
    if (currentUrl.includes('/dashboard/mentor')) {
      addResult('Login', 'Redirect', 'PASS', `Redirected to mentor dashboard: ${currentUrl}`);
    } else {
      addResult('Login', 'Redirect', 'WARN', `Unexpected redirect: ${currentUrl}`);
    }
  } catch (error) {
    addResult('Login', 'Submit', 'FAIL', `Login failed: ${error.message}`);
    return;
  }

  // Check dashboard
  try {
    await delay(1000);
    const dashboard = await page.evaluate(() => {
      const sidebar = !!document.querySelector('[class*="sidebar"], aside, nav[class*="side"]');
      const userInfo = !!document.querySelector('[class*="user"], [class*="profile"], [class*="dropdown"]');
      const content = !!document.querySelector('main, [class*="content"], [class*="dashboard"]');
      
      return { sidebar, userInfo, content };
    });
    
    if (dashboard.sidebar && dashboard.content) {
      addResult('Login', 'Dashboard UI', 'PASS', 'Dashboard loaded with sidebar and content', dashboard);
    } else {
      addResult('Login', 'Dashboard UI', 'WARN', 'Dashboard UI incomplete', dashboard);
    }
  } catch (error) {
    addResult('Login', 'Dashboard UI', 'FAIL', `Dashboard check failed: ${error.message}`);
  }
}

async function verifyLogoutAndSignup(page) {
  console.log('\n=== 4. LOGOUT AND SIGNUP TEST ===');
  
  // Logout
  try {
    // Try to find and click logout
    const logoutSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Log out")',
      'a:has-text("Logout")',
      'a:has-text("Log out")',
      '[class*="logout"]'
    ];
    
    let loggedOut = false;
    for (const selector of logoutSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.count() > 0) {
          // Try to click user dropdown first if it exists
          const dropdown = await page.locator('[class*="dropdown"], [class*="user"]').first();
          if (await dropdown.count() > 0) {
            await dropdown.click();
            await delay(500);
          }
          
          await element.click();
          await delay(2000);
          loggedOut = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (loggedOut) {
      const currentUrl = page.url();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-after-logout.png') });
      
      if (currentUrl.includes('/login')) {
        addResult('Logout', 'Logout & Redirect', 'PASS', `Logged out and redirected to: ${currentUrl}`);
      } else {
        addResult('Logout', 'Logout & Redirect', 'WARN', `Logged out but unexpected URL: ${currentUrl}`);
      }
    } else {
      addResult('Logout', 'Logout Button', 'WARN', 'Could not find logout button');
    }
  } catch (error) {
    addResult('Logout', 'Logout', 'FAIL', `Logout failed: ${error.message}`);
  }

  // Signup
  try {
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle', timeout: 10000 });
    await delay(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-signup-page.png') });
    addResult('Signup', 'Page Load', 'PASS', 'Signup page loaded successfully');
  } catch (error) {
    addResult('Signup', 'Page Load', 'FAIL', `Failed to load: ${error.message}`);
    return;
  }

  // Fill signup form
  try {
    await page.fill('input[name="name"], input[id*="name"]', 'New Tester');
    await page.fill('input[type="email"], input[name="email"]', 'newtester@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'TestPass123!');
    
    // Check agreement checkbox if exists
    const checkbox = await page.locator('input[type="checkbox"]').first();
    if (await checkbox.count() > 0) {
      await checkbox.check();
    }
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-signup-filled.png') });
    addResult('Signup', 'Form Fill', 'PASS', 'Signup form filled successfully');
  } catch (error) {
    addResult('Signup', 'Form Fill', 'FAIL', `Failed to fill form: ${error.message}`);
    return;
  }

  // Submit signup
  try {
    const submitButton = await page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Sign Up")').first();
    await submitButton.click();
    await delay(2000);
    
    const currentUrl = page.url();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-after-signup.png'), fullPage: true });
    
    if (currentUrl.includes('/registeration-steps/role-info') || currentUrl.includes('/registration')) {
      addResult('Signup', 'Redirect', 'PASS', `Redirected to registration: ${currentUrl}`);
    } else {
      addResult('Signup', 'Redirect', 'WARN', `Unexpected redirect: ${currentUrl}`);
    }
  } catch (error) {
    addResult('Signup', 'Submit', 'FAIL', `Signup failed: ${error.message}`);
    return;
  }

  // Check registration layout
  try {
    await delay(1000);
    const layout = await page.evaluate(() => {
      const progressBar = !!document.querySelector('[class*="progress"], [role="progressbar"]');
      const userInfo = !!document.querySelector('[class*="user"], [class*="profile"]');
      const form = !!document.querySelector('form');
      
      return { progressBar, userInfo, form };
    });
    
    if (layout.form) {
      addResult('Signup', 'Registration Layout', 'PASS', 'Registration layout loaded', layout);
    } else {
      addResult('Signup', 'Registration Layout', 'WARN', 'Registration layout incomplete', layout);
    }
  } catch (error) {
    addResult('Signup', 'Registration Layout', 'FAIL', `Layout check failed: ${error.message}`);
  }
}

async function verifyRegistrationFlow(page) {
  console.log('\n=== 5. REGISTRATION FLOW TEST ===');
  
  // Ensure we're on role-info page
  try {
    const currentUrl = page.url();
    if (!currentUrl.includes('role-info')) {
      await page.goto(`${BASE_URL}/auth/registeration-steps/role-info`, { waitUntil: 'networkidle', timeout: 10000 });
    }
    await delay(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-role-info.png') });
  } catch (error) {
    addResult('Registration', 'Role Info Page', 'FAIL', `Failed to load: ${error.message}`);
    return;
  }

  // Select Mentee role
  try {
    const menteeButton = await page.locator('button:has-text("Mentee"), input[value="mentee"], [class*="mentee"]').first();
    await menteeButton.click();
    await delay(500);
    
    const nextButton = await page.locator('button:has-text("Next"), button[type="submit"]').first();
    await nextButton.click();
    await delay(2000);
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-after-role-selection.png') });
    addResult('Registration', 'Role Selection', 'PASS', 'Selected Mentee role and proceeded');
  } catch (error) {
    addResult('Registration', 'Role Selection', 'FAIL', `Failed to select role: ${error.message}`);
    return;
  }

  // Personal Info
  try {
    await page.fill('input[name="firstName"], input[id*="first"]', 'New');
    await page.fill('input[name="lastName"], input[id*="last"]', 'Tester');
    await page.fill('input[name="phone"], input[type="tel"]', '+1555123456');
    
    // Select country
    const countrySelect = await page.locator('select[name="country"], select[id*="country"]').first();
    if (await countrySelect.count() > 0) {
      await countrySelect.selectOption({ label: 'Canada' });
    }
    
    // Select gender
    const genderSelect = await page.locator('select[name="gender"], select[id*="gender"]').first();
    if (await genderSelect.count() > 0) {
      await genderSelect.selectOption({ label: 'Male' });
    }
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-personal-info-filled.png') });
    
    const nextButton = await page.locator('button:has-text("Next"), button[type="submit"]').first();
    await nextButton.click();
    await delay(2000);
    
    addResult('Registration', 'Personal Info', 'PASS', 'Personal info filled and submitted');
  } catch (error) {
    addResult('Registration', 'Personal Info', 'FAIL', `Failed to fill personal info: ${error.message}`);
  }

  // Career Info
  try {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13-career-info-page.png') });
    
    await page.fill('input[name="role"], input[id*="role"]', 'Developer');
    await page.fill('input[name="organization"], input[id*="organization"]', 'Test Corp');
    await page.fill('input[name="years"], input[type="number"]', '2');
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14-career-info-filled.png') });
    
    const nextButton = await page.locator('button:has-text("Next"), button[type="submit"]').first();
    await nextButton.click();
    await delay(2000);
    
    addResult('Registration', 'Career Info', 'PASS', 'Career info filled and submitted');
  } catch (error) {
    addResult('Registration', 'Career Info', 'FAIL', `Failed to fill career info: ${error.message}`);
  }

  // Biography
  try {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15-biography-page.png') });
    
    const bioText = 'I am a passionate developer looking to learn and grow in my career through mentorship.';
    await page.fill('textarea[name="bio"], textarea[id*="bio"]', bioText);
    
    // Add skills
    const skillInput = await page.locator('input[name="skill"], input[id*="skill"]').first();
    if (await skillInput.count() > 0) {
      await skillInput.fill('React');
      await page.keyboard.press('Enter');
      await delay(300);
      await skillInput.fill('Angular');
      await page.keyboard.press('Enter');
      await delay(300);
    }
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16-biography-filled.png') });
    
    const nextButton = await page.locator('button:has-text("Next"), button[type="submit"]').first();
    await nextButton.click();
    await delay(2000);
    
    addResult('Registration', 'Biography', 'PASS', 'Biography filled and submitted');
  } catch (error) {
    addResult('Registration', 'Biography', 'FAIL', `Failed to fill biography: ${error.message}`);
  }

  // Preview and Complete
  try {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17-preview-page.png'), fullPage: true });
    
    const completeButton = await page.locator('button:has-text("Complete"), button:has-text("Finish"), button[type="submit"]').first();
    await completeButton.click();
    await delay(2000);
    
    const finalUrl = page.url();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18-after-completion.png'), fullPage: true });
    
    if (finalUrl.includes('/browse') || finalUrl.includes('/dashboard')) {
      addResult('Registration', 'Complete', 'PASS', `Registration completed, redirected to: ${finalUrl}`);
    } else {
      addResult('Registration', 'Complete', 'WARN', `Unexpected final URL: ${finalUrl}`);
    }
  } catch (error) {
    addResult('Registration', 'Complete', 'FAIL', `Failed to complete registration: ${error.message}`);
  }
}

async function verifyRouteGuards(page) {
  console.log('\n=== 6. ROUTE GUARD TEST ===');
  
  // Test admin dashboard access (should redirect)
  try {
    await page.goto(`${BASE_URL}/dashboard/admin`, { waitUntil: 'networkidle', timeout: 10000 });
    await delay(1000);
    
    const currentUrl = page.url();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19-admin-access-attempt.png') });
    
    if (!currentUrl.includes('/dashboard/admin')) {
      addResult('Route Guards', 'Admin Access Denied', 'PASS', `Correctly redirected from admin to: ${currentUrl}`);
    } else {
      addResult('Route Guards', 'Admin Access Denied', 'FAIL', 'Mentee was able to access admin dashboard');
    }
  } catch (error) {
    addResult('Route Guards', 'Admin Access', 'WARN', `Error testing admin access: ${error.message}`);
  }

  // Test mentee dashboard access (should work)
  try {
    await page.goto(`${BASE_URL}/dashboard/mentee`, { waitUntil: 'networkidle', timeout: 10000 });
    await delay(1000);
    
    const currentUrl = page.url();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20-mentee-dashboard.png'), fullPage: true });
    
    if (currentUrl.includes('/dashboard/mentee')) {
      addResult('Route Guards', 'Mentee Access Allowed', 'PASS', 'Mentee can access mentee dashboard');
    } else {
      addResult('Route Guards', 'Mentee Access Allowed', 'FAIL', `Unexpected redirect: ${currentUrl}`);
    }
  } catch (error) {
    addResult('Route Guards', 'Mentee Access', 'FAIL', `Error accessing mentee dashboard: ${error.message}`);
  }
}

async function runTests() {
  console.log('Starting comprehensive verification...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  try {
    await verifyLandingPage(page);
    await verifyBrowseMentors(page);
    await verifyLoginFlow(page);
    await verifyLogoutAndSignup(page);
    await verifyRegistrationFlow(page);
    await verifyRouteGuards(page);
  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error);
    results.tests.push({
      section: 'System',
      test: 'Fatal Error',
      status: 'FAIL',
      message: error.message
    });
    results.summary.failed++;
  } finally {
    await browser.close();
  }

  // Save results
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'verification-results.json'),
    JSON.stringify(results, null, 2)
  );

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✓ Passed: ${results.summary.passed}`);
  console.log(`✗ Failed: ${results.summary.failed}`);
  console.log(`⚠ Warnings: ${results.summary.warnings}`);
  console.log(`Total Tests: ${results.tests.length}`);
  console.log('='.repeat(60));
  
  if (results.summary.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => console.log(`  - [${t.section}] ${t.test}: ${t.message}`));
  }
  
  if (results.summary.warnings > 0) {
    console.log('\n⚠ WARNINGS:');
    results.tests
      .filter(t => t.status === 'WARN')
      .forEach(t => console.log(`  - [${t.section}] ${t.test}: ${t.message}`));
  }

  console.log(`\n📸 Screenshots saved to: ${SCREENSHOT_DIR}/`);
  console.log(`📄 Full results saved to: ${SCREENSHOT_DIR}/verification-results.json`);
  
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

runTests();
