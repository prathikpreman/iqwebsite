const { chromium } = require('playwright');

const BASE = 'http://localhost:8080';
const pages = [
  '/index.html',
  '/about/company-profile.html',
  '/about/history.html',
  '/about/vision-mission.html',
  '/about/ceo-message.html',
  '/about/corporate-values.html',
  '/about/leadership-team.html',
  '/about/our-partners.html',
  '/solutions/index.html',
  '/solutions/wells-management.html',
  '/solutions/reservoir-management.html',
  '/solutions/surface-facilities.html',
  '/solutions/integrated-asset-management.html',
  '/services/index.html',
  '/services/business-transformation.html',
  '/services/deployment-services.html',
  '/services/productization-services.html',
  '/case-studies/index.html',
  '/case-studies/asset-home-page.html',
  '/case-studies/exception-based-surveillance-wells.html',
  '/case-studies/exception-based-surveillance-data-quality.html',
  '/case-studies/exception-based-surveillance-waterflooded-reservoirs.html',
  '/news/index.html',
  '/careers.html',
  '/contact.html',
  '/terms.html',
  '/privacy.html',
  '/cookies.html',
];

const widths = [1920, 1440, 1280, 1024, 768, 480, 390, 375, 320];

(async () => {
  const browser = await chromium.launch();
  let totalIssues = 0;

  for (const page of pages) {
    for (const w of widths) {
      // Fresh context + fresh navigation per breakpoint: matches how a real
      // device actually loads the page (no stale IntersectionObserver state
      // carried over from a different, previously-loaded viewport size).
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
      const tab = await ctx.newPage();
      const consoleErrors = [];
      tab.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
      tab.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

      const resp = await tab.goto(BASE + page, { waitUntil: 'networkidle' });
      const status = resp.status();
      if (status !== 200) {
        console.log(`[${page}] HTTP ${status} !!`);
        totalIssues++;
      }

      await tab.waitForTimeout(150);
      const overflow = await tab.evaluate(() => {
        const doc = document.documentElement;
        return { scrollW: doc.scrollWidth, clientW: doc.clientWidth };
      });
      if (overflow.scrollW > overflow.clientW + 1) {
        console.log(`[${page}] @${w}px HORIZONTAL OVERFLOW: scrollWidth=${overflow.scrollW} clientWidth=${overflow.clientW}`);
        totalIssues++;
      }

      const realErrors = consoleErrors.filter((e) => !/fonts\.googleapis|ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED/.test(e));
      if (realErrors.length) {
        console.log(`[${page}] @${w}px CONSOLE ERRORS:`, realErrors.slice(0, 5));
        totalIssues += realErrors.length;
      }

      await ctx.close();
    }
  }

  await browser.close();
  console.log(totalIssues === 0 ? '\nAll pages clean: no overflow, no console errors.' : `\n${totalIssues} issue(s) found.`);
  process.exit(totalIssues === 0 ? 0 : 1);
})();
