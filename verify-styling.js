const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const results = {
    landingPage: {},
    browsePage: {},
    signupPage: {}
  };

  try {
    // 1. Landing Page Verification
    console.log('Navigating to landing page...');
    await page.goto('http://localhost:4200', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'styling-verification/01-landing.png', fullPage: true });
    
    // Check primary color
    const primaryButton = await page.locator('button.bg-primary, a.bg-primary').first();
    if (await primaryButton.count() > 0) {
      const bgColor = await primaryButton.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      results.landingPage.primaryColor = bgColor;
      console.log('Primary button color:', bgColor);
    }
    
    // Check fonts
    const heading = await page.locator('h1, h2').first();
    if (await heading.count() > 0) {
      const headingFont = await heading.evaluate(el => {
        return window.getComputedStyle(el).fontFamily;
      });
      results.landingPage.headingFont = headingFont;
      console.log('Heading font:', headingFont);
    }
    
    const bodyText = await page.locator('p').first();
    if (await bodyText.count() > 0) {
      const bodyFont = await bodyText.evaluate(el => {
        return window.getComputedStyle(el).fontFamily;
      });
      results.landingPage.bodyFont = bodyFont;
      console.log('Body font:', bodyFont);
    }
    
    // Check spacing and rounded corners
    const card = await page.locator('.rounded-lg, .rounded-xl, .rounded-2xl').first();
    if (await card.count() > 0) {
      const borderRadius = await card.evaluate(el => {
        return window.getComputedStyle(el).borderRadius;
      });
      results.landingPage.borderRadius = borderRadius;
      console.log('Border radius:', borderRadius);
    }
    
    // 2. Browse Page Verification
    console.log('\nNavigating to browse page...');
    await page.goto('http://localhost:4200/browse', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'styling-verification/02-browse.png', fullPage: true });
    
    // Check mentor cards
    const mentorCards = await page.locator('.mentor-card, [class*="mentor"], .card').all();
    results.browsePage.mentorCardCount = mentorCards.length;
    console.log('Mentor cards found:', mentorCards.length);
    
    if (mentorCards.length > 0) {
      const firstCard = mentorCards[0];
      const cardStyles = await firstCard.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          borderRadius: styles.borderRadius,
          padding: styles.padding,
          boxShadow: styles.boxShadow,
          backgroundColor: styles.backgroundColor
        };
      });
      results.browsePage.cardStyles = cardStyles;
      console.log('Card styles:', cardStyles);
    }
    
    // 3. Signup Page Verification
    console.log('\nNavigating to signup page...');
    await page.goto('http://localhost:4200/signup', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'styling-verification/03-signup.png', fullPage: true });
    
    // Check input styling
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"]').all();
    results.signupPage.inputCount = inputs.length;
    console.log('Input fields found:', inputs.length);
    
    if (inputs.length > 0) {
      const firstInput = inputs[0];
      const inputStyles = await firstInput.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          borderRadius: styles.borderRadius,
          padding: styles.padding,
          border: styles.border
        };
      });
      results.signupPage.inputStyles = inputStyles;
      console.log('Input styles:', inputStyles);
    }
    
    // Check button styling
    const submitButton = await page.locator('button[type="submit"]').first();
    if (await submitButton.count() > 0) {
      const buttonStyles = await submitButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderRadius: styles.borderRadius,
          padding: styles.padding
        };
      });
      results.signupPage.buttonStyles = buttonStyles;
      console.log('Button styles:', buttonStyles);
    }
    
    // Save results
    fs.writeFileSync('styling-verification/results.json', JSON.stringify(results, null, 2));
    console.log('\n✅ Verification complete! Results saved to styling-verification/results.json');
    
  } catch (error) {
    console.error('Error during verification:', error);
    results.error = error.message;
    fs.writeFileSync('styling-verification/results.json', JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
})();
