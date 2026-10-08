import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";

const browser = await chromium.launch({channel:"msedge"});
try {
  const context = await browser.newContext({viewport:{width:1440,height:900}});
  const page = await context.newPage();
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto(process.env.GALLERY_TEST_URL ?? "https://skintific-gallery.vercel.app/");
  await page.waitForFunction(() => /^\d+ images?/.test(document.querySelector("main > p[aria-live]")?.textContent ?? ""),null,{timeout:30000});
  assert.equal(await page.getByRole("button",{name:"Trash",exact:true}).count(),0);
  assert.equal(await page.getByRole("button",{name:"Upload images",exact:true}).count(),0);
  const count=await page.locator(".tile").count();
  if(count) {
    await page.locator(".tile-button").first().click();
    await page.getByRole("button",{name:"Download original"}).waitFor();
    assert.equal(await page.getByRole("button",{name:"Edit details",exact:true}).count(),0);
    assert.equal(await page.getByRole("button",{name:"Move to Trash",exact:true}).count(),0);
    await page.waitForFunction(()=>{const img=document.querySelector("dialog img");return img instanceof HTMLImageElement && img.complete && img.naturalWidth>0;});
    await page.keyboard.press("Escape");
  }
  await page.screenshot({path:"test-results/live-desktop-feed.png",fullPage:true});
  const audit=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
  assert.deepEqual(audit.violations,[]);
  await page.setViewportSize({width:375,height:812});
  await page.screenshot({path:"test-results/live-mobile-feed.png",fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole("link",{name:"Sign in to upload"}).first().click();
  await page.waitForURL("**/login");
  assert.deepEqual(errors,[]);
  console.log(`PASS: live public gallery (${count} visible images), signed image preview, guest management hidden, sign-in upload link, axe, mobile overflow, no page errors`);
} finally {await browser.close();}
