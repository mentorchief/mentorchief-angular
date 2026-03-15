const { chromium } = require('playwright');

async function testAuthFlow() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    signup: { passed: false, issues: [] },
    registration: { passed: false, issues: [] },
    login: { passed: false, issues: [] },
    routeGuard: { passed: false, issues: [] }
  };

  try {
    console.log('\n========================================');
    console.log('TESTING SIGNUP FLOW');
    console.log('========================================\n');
    
    // 1. Navigate to signup page
    console.log('✓ Navigating to /signup...');
    await page.goto('http://localhost:4200/signup');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-flow/01-signup-page.png' });
    
    // Verify form fields
    console.log('✓ Verifying signup form fields...');
    const nameField = await page.locator('input[placeholder="John Doe"]');
    const emailField = await page.locator('input[type="email"]');
    const passwordField = await page.locator('input[placeholder="Min. 8 characters"]');
    const agreeCheckbox = await page.locator('input[type="checkbox"]').first();
    
    if (!(await nameField.isVisible())) results.signup.issues.push('Name field not visible');
    if (!(await emailField.isVisible())) results.signup.issues.push('Email field not visible');
    if (!(await passwordField.isVisible())) results.signup.issues.push('Password field not visible');
    if (!(await agreeCheckbox.isVisible())) results.signup.issues.push('Agreement checkbox not visible');
    
    console.log('  - Name field:', await nameField.isVisible() ? '✓' : '✗');
    console.log('  - Email field:', await emailField.isVisible() ? '✓' : '✗');
    console.log('  - Password field:', await passwordField.isVisible() ? '✓' : '✗');
    console.log('  - Agreement checkbox:', await agreeCheckbox.isVisible() ? '✓' : '✗');
    
    // Fill and submit signup form
    console.log('✓ Filling signup form...');
    await nameField.fill('Test User');
    await emailField.fill('testuser@example.com');
    await passwordField.fill('Test1234!');
    await agreeCheckbox.check();
    await page.screenshot({ path: 'test-flow/02-signup-filled.png' });
    
    console.log('✓ Submitting signup form...');
    const submitButton = await page.locator('button:has-text("Create Account")');
    await submitButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-flow/03-after-signup.png' });
    
    const currentUrl = page.url();
    console.log('  Current URL:', currentUrl);
    
    if (currentUrl.includes('/auth/registration-steps/role-info')) {
      console.log('  ✓ Redirected to registration steps');
      results.signup.passed = true;
      
      // Verify registration layout
      console.log('✓ Verifying registration layout...');
      const header = await page.locator('header, nav, .header').first().isVisible();
      console.log('  - Header:', header ? '✓' : '✗');
      if (!header) results.registration.issues.push('Header not visible');
      
      await page.screenshot({ path: 'test-flow/04-registration-layout.png' });
      
      console.log('\n========================================');
      console.log('COMPLETING REGISTRATION');
      console.log('========================================\n');
      
      // Step 1: Role selection
      console.log('✓ Selecting Mentee role...');
      const menteeButton = await page.locator('button:has-text("I\'m a Mentee")');
      await menteeButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-flow/05-mentee-selected.png' });
      
      const nextButton1 = await page.locator('button:has-text("Next")');
      await nextButton1.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'test-flow/06-after-role.png' });
      
      // Step 2: Personal Info
      console.log('✓ Filling personal info...');
      const url2 = page.url();
      console.log('  Current URL:', url2);
      
      if (!url2.includes('personal-info')) {
        results.registration.issues.push('Did not navigate to personal-info page');
      }
      
      await page.locator('input[placeholder="John"]').fill('Test');
      await page.locator('input[placeholder="Doe"]').fill('User');
      await page.locator('input[type="tel"]').fill('+1234567890');
      await page.locator('select').nth(0).selectOption('United States');
      await page.locator('select').nth(1).selectOption('male');
      await page.screenshot({ path: 'test-flow/07-personal-info-filled.png' });
      
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(1500);
      
      // Step 3: Career Info
      console.log('✓ Filling career info...');
      const url3 = page.url();
      console.log('  Current URL:', url3);
      
      if (!url3.includes('career-info')) {
        results.registration.issues.push('Did not navigate to career-info page');
      }
      
      const inputs = await page.locator('input[type="text"]').all();
      if (inputs[0]) await inputs[0].fill('Student');
      if (inputs[1]) await inputs[1].fill('Test University');
      
      const yearsInput = await page.locator('input[type="number"]');
      await yearsInput.fill('1');
      
      await page.screenshot({ path: 'test-flow/08-career-info-filled.png' });
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(1500);
      
      // Step 4: Biography
      console.log('✓ Filling biography...');
      const url4 = page.url();
      console.log('  Current URL:', url4);
      
      if (!url4.includes('biography')) {
        results.registration.issues.push('Did not navigate to biography page');
      }
      
      const textarea = await page.locator('textarea');
      await textarea.fill('This is a comprehensive test biography with more than fifty characters to meet the minimum requirement for the biography field in the registration form.');
      
      // Add skills
      const skillInput = await page.locator('input[placeholder="Type a skill and press Enter"]');
      await skillInput.fill('JavaScript');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      await skillInput.fill('TypeScript');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      await skillInput.fill('Angular');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      await page.screenshot({ path: 'test-flow/09-biography-filled.png' });
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(2000);
      
      // Step 5: Preview
      console.log('✓ Verifying preview page...');
      const url5 = page.url();
      console.log('  Current URL:', url5);
      
      if (!url5.includes('preview')) {
        results.registration.issues.push('Did not navigate to preview page');
      }
      
      await page.screenshot({ path: 'test-flow/10-preview-page.png' });
      
      const completeButton = await page.locator('button:has-text("Complete Registration")');
      const hasButton = await completeButton.count() > 0;
      
      if (hasButton) {
        await completeButton.click();
        await page.waitForTimeout(2000);
        
        const finalUrl = page.url();
        console.log('  Final URL:', finalUrl);
        
        if (finalUrl.includes('/browse')) {
          console.log('  ✓ Redirected to /browse for mentee');
          results.registration.passed = true;
        } else {
          console.log('  ✗ Expected redirect to /browse, got:', finalUrl);
          results.registration.issues.push(`Expected /browse, got ${finalUrl}`);
        }
        
        await page.screenshot({ path: 'test-flow/11-after-registration.png' });
      } else {
        console.log('  ✗ Complete Registration button not found');
        results.registration.issues.push('Complete Registration button not found');
      }
    } else {
      console.log('  ✗ Not redirected to registration steps');
      results.signup.issues.push(`Expected /auth/registration-steps/role-info, got ${currentUrl}`);
    }
    
    // Test login
    console.log('\n========================================');
    console.log('TESTING LOGIN');
    console.log('========================================\n');
    
    console.log('✓ Clearing session (logout)...');
    // Clear local storage and cookies to simulate logout
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());
    await page.waitForTimeout(500);
    
    console.log('✓ Navigating to /login...');
    await page.goto('http://localhost:4200/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-flow/12-login-page.png' });
    
    console.log('✓ Logging in as mentor@demo.com...');
    const loginEmail = await page.locator('input[type="email"]');
    const loginPassword = await page.locator('input[type="password"]');
    
    await loginEmail.fill('mentor@demo.com');
    await loginPassword.fill('password123');
    await page.screenshot({ path: 'test-flow/13-login-filled.png' });
    
    const loginButton = await page.locator('button[type="submit"]');
    await loginButton.click();
    await page.waitForTimeout(2000);
    
    const loginUrl = page.url();
    console.log('  Current URL:', loginUrl);
    
    if (loginUrl.includes('/dashboard/mentor')) {
      console.log('  ✓ Redirected to /dashboard/mentor');
      results.login.passed = true;
    } else {
      console.log('  ✗ Expected redirect to /dashboard/mentor, got:', loginUrl);
      results.login.issues.push(`Expected /dashboard/mentor, got ${loginUrl}`);
    }
    
    await page.screenshot({ path: 'test-flow/14-after-login.png' });
    
    // Test route guard
    console.log('\n========================================');
    console.log('TESTING ROUTE GUARDS');
    console.log('========================================\n');
    
    console.log('✓ Testing mentee dashboard access as mentor...');
    await page.goto('http://localhost:4200/dashboard/mentee');
    await page.waitForTimeout(1500);
    
    const guardUrl = page.url();
    console.log('  Current URL:', guardUrl);
    
    if (!guardUrl.includes('/dashboard/mentee')) {
      console.log('  ✓ Route guard working - redirected away from mentee dashboard');
      results.routeGuard.passed = true;
    } else {
      console.log('  ✗ Route guard not working - still on mentee dashboard');
      results.routeGuard.issues.push('Route guard failed - accessed mentee dashboard as mentor');
    }
    
    await page.screenshot({ path: 'test-flow/15-route-guard-test.png' });
    
  } catch (error) {
    console.error('\n✗ Error during test:', error.message);
    await page.screenshot({ path: 'test-flow/error.png' });
  } finally {
    await browser.close();
    
    // Print summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================\n');
    
    console.log('Signup:', results.signup.passed ? '✓ PASSED' : '✗ FAILED');
    if (results.signup.issues.length > 0) {
      results.signup.issues.forEach(issue => console.log('  -', issue));
    }
    
    console.log('Registration:', results.registration.passed ? '✓ PASSED' : '✗ FAILED');
    if (results.registration.issues.length > 0) {
      results.registration.issues.forEach(issue => console.log('  -', issue));
    }
    
    console.log('Login:', results.login.passed ? '✓ PASSED' : '✗ FAILED');
    if (results.login.issues.length > 0) {
      results.login.issues.forEach(issue => console.log('  -', issue));
    }
    
    console.log('Route Guard:', results.routeGuard.passed ? '✓ PASSED' : '✗ FAILED');
    if (results.routeGuard.issues.length > 0) {
      results.routeGuard.issues.forEach(issue => console.log('  -', issue));
    }
    
    const allPassed = results.signup.passed && results.registration.passed && results.login.passed && results.routeGuard.passed;
    console.log('\n' + (allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'));
    console.log('========================================\n');
  }
}

testAuthFlow();
