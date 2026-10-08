import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";

const browser = await chromium.launch({channel:"msedge"});
try {
  const context = await browser.newContext({viewport:{width:1440,height:900}});
  const page = await context.newPage();
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto(process.env.GALLERY_TEST_URL ?? "http://127.0.0.1:4180/");
  await page.getByRole("link",{name:"Sign in to upload"}).first().waitFor();
  assert.ok(!page.url().endsWith("/login"),"Gallery should open without signing in");
  assert.equal(await page.getByRole("button",{name:"Upload images",exact:true}).count(),0);
  assert.equal(await page.getByRole("button",{name:"Trash",exact:true}).count(),0);
  await page.getByRole("link",{name:"Sign in to upload"}).first().click();
  await page.waitForURL("**/login");
  await page.getByRole("button",{name:"Sign in",exact:true}).click();
  assert.equal(await page.locator('input[type="email"]').evaluate(input=>input.validity.valueMissing),true);
  await page.route("**/auth/v1/token**",route=>route.fulfill({status:400,contentType:"application/json",body:'{"code":"invalid_credentials","message":"Invalid login credentials"}'}));
  await page.getByLabel("Email",{exact:true}).fill("test@example.invalid");
  await page.getByLabel("Password",{exact:true}).fill("test-only-password");
  await page.getByRole("button",{name:"Sign in",exact:true}).click();
  await page.locator(".error[role=alert]").waitFor();
  assert.match(await page.locator(".error[role=alert]").innerText(),/Sign-in failed/);
  const audit=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
  assert.deepEqual(audit.violations,[]);
  await page.reload();
  await page.screenshot({path:"test-results/login-desktop.png",fullPage:true});
  await page.setViewportSize({width:375,height:812});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:"test-results/login-mobile.png",fullPage:true});
  assert.deepEqual(errors,[]);
  console.log("PASS: public gallery, guest upload link to login, no guest management controls, required fields, invalid login feedback (intercepted auth response), axe, mobile overflow, no page errors");
} finally {await browser.close();}
