const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const businessId = 'cmswbwcvd000198rdmlk2dedq';
    const url = `http://localhost:3000/business/${businessId}`;

    console.log(`Testing URL: ${url}`);

    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const status = response?.status();
    console.log(`HTTP Status: ${status}`);

    if (status === 404) {
      console.log('\n❌ 404 ERROR FOUND');

      // Check page content
      const bodyText = await page.textContent('body');
      console.log('\nPage content preview:');
      console.log(bodyText?.substring(0, 500));

      await page.screenshot({ path: '404-error.png', fullPage: true });
      console.log('\nScreenshot saved to 404-error.png');
    } else {
      console.log('\n✓ Page loaded successfully');

      // Check if services and staff are visible
      const servicesVisible = await page.locator('h2:has-text("Услуги")').isVisible();
      const staffVisible = await page.locator('h2:has-text("Наши мастера")').isVisible();

      const serviceCount = await page.locator('text=/Мужская стрижка|Стрижка|Бритьё|Королевское/').count();
      const staffCount = await page.locator('text=/Арман|Даурен/').count();

      console.log(`\n✓ Services section visible: ${servicesVisible}`);
      console.log(`✓ Service cards found: ${serviceCount}`);
      console.log(`✓ Staff section visible: ${staffVisible}`);
      console.log(`✓ Staff cards found: ${staffCount}`);

      await page.screenshot({ path: 'business-page-success.png', fullPage: true });
      console.log('\nScreenshot saved to business-page-success.png');
    }

    // Test homepage
    console.log('\n--- Testing Homepage ---');
    const homeResponse = await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log(`Homepage HTTP Status: ${homeResponse?.status()}`);

    // Check if business link is present on homepage
    const businessLink = await page.locator(`a[href*="${businessId}"]`).first();
    const hasLink = await businessLink.isVisible().catch(() => false);
    console.log(`Business link on homepage: ${hasLink}`);

    if (hasLink) {
      console.log('\n--- Testing navigation from homepage ---');
      await businessLink.click();
      await page.waitForTimeout(2000);

      const finalUrl = page.url();
      console.log(`Final URL after click: ${finalUrl}`);

      const finalStatus = await page.evaluate(() => document.readyState);
      console.log(`Page state: ${finalStatus}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('Error screenshot saved');
  } finally {
    await browser.close();
  }
})();
