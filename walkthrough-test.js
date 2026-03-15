const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotsDir = path.join(__dirname, 'walkthrough-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const results = [];
  let stepNum = 0;

  // Helper to capture console messages and errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  page.on('pageerror', error => {
    consoleMessages.push({
      type: 'error',
      text: error.message,
      stack: error.stack
    });
  });

  async function takeScreenshotAndLog(stepName, description) {
    stepNum++;
    const filename = `${stepNum.toString().padStart(2, '0')}-${stepName}.png`;
    const filepath = path.join(screenshotsDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    
    const url = page.url();
    const title = await page.title();
    const recentConsole = consoleMessages.slice(-10); // Last 10 console messages
    
    results.push({
      step: stepNum,
      name: stepName,
      description,
      url,
      title,
      screenshot: filename,
      consoleMessages: recentConsole,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✓ Step ${stepNum}: ${stepName} - ${description}`);
    if (recentConsole.some(m => m.type === 'error')) {
      console.log(`  ⚠️  Console errors detected`);
    }
    
    // Clear console messages for next step
    consoleMessages.length = 0;
  }

  try {
    console.log('Starting walkthrough...\n');

    // Step 1: Home page
    console.log('Step 1: Navigating to home page...');
    await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await takeScreenshotAndLog('home', 'Home page loaded');

    // Step 2: Login page
    console.log('\nStep 2: Navigating to login page...');
    await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await takeScreenshotAndLog('login', 'Login page loaded');

    // Fill login form
    console.log('Filling login form...');
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'mentee@demo.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.waitForTimeout(500);
    await takeScreenshotAndLog('login-filled', 'Login form filled');

    // Click Sign In
    console.log('Clicking Sign In button...');
    await page.click('button:has-text("Sign In"), button:has-text("sign in"), button[type="submit"]');
    await page.waitForTimeout(2000);
    await takeScreenshotAndLog('login-result', 'After clicking Sign In');

    // Step 3: Signup page
    console.log('\nStep 3: Navigating to signup page...');
    await page.goto('http://localhost:4200/signup', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await takeScreenshotAndLog('signup', 'Signup page loaded');

    // Step 4: Forgot password
    console.log('\nStep 4: Navigating to forgot password page...');
    await page.goto('http://localhost:4200/forgot-password', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await takeScreenshotAndLog('forgot-password', 'Forgot password page loaded');

    // Fill email and click Send Reset Link
    console.log('Filling email and clicking Send Reset Link...');
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Send Reset Link"), button:has-text("send"), button[type="submit"]');
    await page.waitForTimeout(2000);
    await takeScreenshotAndLog('forgot-password-success', 'After clicking Send Reset Link');

    // Step 5: Verify email
    console.log('\nStep 5: Navigating to verify email page...');
    await page.goto('http://localhost:4200/verify-email', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await takeScreenshotAndLog('verify-email', 'Verify email page loaded');

    // Fill 6-digit code
    console.log('Filling 6-digit verification code...');
    const digitInputs = await page.locator('input[type="text"], input[maxlength="1"]').all();
    if (digitInputs.length >= 6) {
      for (let i = 0; i < 6; i++) {
        await digitInputs[i].fill((i + 1).toString());
        await page.waitForTimeout(200);
      }
    } else {
      // Try alternative selector
      const inputs = await page.locator('input').all();
      for (let i = 0; i < Math.min(6, inputs.length); i++) {
        try {
          await inputs[i].fill((i + 1).toString());
          await page.waitForTimeout(200);
        } catch (e) {
          console.log(`Could not fill input ${i}: ${e.message}`);
        }
      }
    }
    await page.waitForTimeout(1000);
    await takeScreenshotAndLog('verify-email-filled', 'Verification code filled');

    // Step 6: Reset password
    console.log('\nStep 6: Navigating to reset password page...');
    await page.goto('http://localhost:4200/reset-password', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await takeScreenshotAndLog('reset-password', 'Reset password page loaded');

    // Fill password fields
    console.log('Filling password fields...');
    const passwordInputs = await page.locator('input[type="password"]').all();
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].fill('NewPassword1');
      await passwordInputs[1].fill('NewPassword1');
      await page.waitForTimeout(1000);
      await takeScreenshotAndLog('reset-password-filled', 'Password fields filled');
    }

    // Step 7: Registration flow
    console.log('\nStep 7: Navigating to registration role-info page...');
    await page.goto('http://localhost:4200/auth/registeration-steps/role-info', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await takeScreenshotAndLog('role-info', 'Role info page loaded');

    // Click "I'm a Mentee"
    console.log('Clicking "I\'m a Mentee" button...');
    await page.click('button:has-text("I\'m a Mentee"), button:has-text("Mentee"), [role="button"]:has-text("Mentee")');
    await page.waitForTimeout(1000);
    await takeScreenshotAndLog('mentee-selected', 'Mentee option selected');

    // Click Next
    console.log('Clicking Next button...');
    await page.click('button:has-text("Next"), button[type="submit"]');
    await page.waitForTimeout(2000);
    await takeScreenshotAndLog('personal-info', 'Personal info page loaded');

    console.log('\n✅ Walkthrough completed successfully!');

  } catch (error) {
    console.error('\n❌ Error during walkthrough:', error.message);
    console.error(error.stack);
    
    // Take error screenshot
    try {
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'error.png'), 
        fullPage: true 
      });
    } catch (e) {
      console.error('Could not take error screenshot:', e.message);
    }
    
    results.push({
      step: 'ERROR',
      error: error.message,
      stack: error.stack,
      url: page.url()
    });
  } finally {
    // Save results to JSON
    fs.writeFileSync(
      path.join(screenshotsDir, 'walkthrough-results.json'),
      JSON.stringify(results, null, 2)
    );
    
    console.log(`\n📊 Results saved to: ${path.join(screenshotsDir, 'walkthrough-results.json')}`);
    console.log(`📸 Screenshots saved to: ${screenshotsDir}`);

    await browser.close();
  }
})();
