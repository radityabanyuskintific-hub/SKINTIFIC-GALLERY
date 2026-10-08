import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
type Row = Record<string, unknown>;
test("public visitors can browse details but cannot upload or manage images", async ({page}) => {
  await backend(page,[{id:"public-fixture",owner_id:"test-owner",storage_path:"test/public.png",title:"Test public image",filename:"public.png",collection:"Test collection",tags:[],mime_type:"image/png",bytes:100,width:600,height:450,created_at:"2026-10-08T00:00:00Z",updated_at:"2026-10-08T00:00:00Z",deleted_at:null}]);
  await page.goto("/?guest");
  await page.getByRole("button",{name:"Open Test public image"}).click();
  await expect(page.getByRole("button",{name:"Download original"})).toBeVisible();
  for (const name of ["Edit details", "Move to Trash", "Restore image"]) await expect(page.getByRole("button",{name,exact:true})).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button",{name:"Trash",exact:true})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Upload images",exact:true})).toHaveCount(0);
  const audit=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
  expect(audit.violations).toEqual([]);
  await page.getByRole("link",{name:"Sign in to upload"}).click();
  await expect(page).toHaveURL(/\/login$/);
});
async function backend(page: Page, initial: Row[] = []) {
  const rows = [...initial];
  const previews = await page.evaluate(() => [450,800].map((height,index) => {
    const canvas=document.createElement("canvas");canvas.width=600;canvas.height=height;
    const ctx=canvas.getContext("2d")!;
    ctx.fillStyle=index ? "#dad4cb" : "#c4ccd0";ctx.fillRect(0,0,600,height);
    ctx.fillStyle=index ? "#787066" : "#58676f";ctx.fillRect(100,80,400,height-160);
    return canvas.toDataURL("image/png").split(",")[1];
  }));
  await page.route("https://gallery.test/**", async route => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const headers = {"access-control-allow-origin":"*", "access-control-allow-headers":"*", "access-control-expose-headers":"content-range", "content-type":"application/json"};
    if(method === "OPTIONS") return route.fulfill({status:204,headers:{...headers,"access-control-allow-methods":"GET,POST,PATCH,DELETE"}});
    if(url.pathname.includes("/rest/v1/gallery_collections")) return route.fulfill({headers,body:JSON.stringify([...new Set(rows.map(row=>row.collection).filter(Boolean))].map(name=>({name})))});
    if(url.pathname.includes("/rest/v1/gallery_images")) {
      if(method === "POST") {const row=route.request().postDataJSON();rows.push({...row,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),deleted_at:null});return route.fulfill({status:201,headers,body:""});}
      if(method === "PATCH") {const id=url.searchParams.get("id")?.slice(3);const row=rows.find(row=>row.id===id);Object.assign(row!,route.request().postDataJSON());return route.fulfill({headers,body:JSON.stringify({id})});}
      let filtered = rows.filter(row=>url.searchParams.get("deleted_at")==="not.is.null" ? !!row.deleted_at : !row.deleted_at);
      const collection=url.searchParams.get("collection")?.slice(3);if(collection) filtered=filtered.filter(row=>row.collection===collection);
      const tag=url.searchParams.get("tags")?.match(/cs\.\{(.+)\}/)?.[1];if(tag) filtered=filtered.filter(row=>(row.tags as string[]).includes(tag));
      const q=url.searchParams.get("search_document")?.split(").")[1];if(q) filtered=filtered.filter(row=>JSON.stringify(row).toLowerCase().includes(q.toLowerCase()));
      if(url.searchParams.get("order")?.startsWith("title")) filtered.sort((a,b)=>String(a.title).localeCompare(String(b.title)));
      const offset=Number(url.searchParams.get("offset")??0); const limit=Number(url.searchParams.get("limit")??36);
      return route.fulfill({headers:{...headers,"content-range":`${offset}-${Math.max(offset,offset+Math.min(limit,filtered.length)-1)}/${filtered.length}`},body:JSON.stringify(filtered.slice(offset,offset+limit))});
    }
    if(url.pathname.includes("/storage/v1/object/sign/") && method === "POST") {
      const body=route.request().postDataJSON();
      return route.fulfill({headers,body:JSON.stringify(body.paths ? body.paths.map((path:string)=>({path,signedURL:`/object/sign/gallery-originals/${path}?token=test`,error:null})) : {signedURL:"/object/sign/gallery-originals/test.png?token=test"})});
    }
    if(method === "GET" && url.pathname.includes("/storage/")) {
      const index=Number(url.pathname.match(/image-(\d+)/)?.[1]??0)%2;
      return route.fulfill({contentType:"image/png",headers:url.pathname.endsWith("/test.png") ? {"content-disposition":'attachment; filename="test.png"'} : {},body:Buffer.from(previews[index],"base64")});
    }
    if(url.pathname.includes("/storage/")) return route.fulfill({headers,body:JSON.stringify({Key:"test-upload"})});
    return route.fulfill({headers,body:"{}"});
  });
  return rows;
}

test("upload, edit, search, trash, restore, and modal keyboard behavior", async ({page})=>{
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  await backend(page);await page.goto("/");
  await expect(page.getByText("Your library starts with an image.")).toBeVisible();
  await page.getByRole("button",{name:"Upload your first images"}).click();
  await page.locator('input[type="file"]').setInputFiles({name:"reference.png",mimeType:"image/png",buffer:png});
  await page.getByLabel("Title",{exact:true}).fill("Glass reference");
  await page.getByRole("dialog").getByLabel(/^Collection/).fill("Packaging");
  await page.getByRole("dialog").getByLabel(/^Tags/).fill("glass, blue");
  await page.getByRole("dialog").getByRole("button",{name:"Upload images",exact:true}).click();
  await expect(page.getByRole("button",{name:"Open Glass reference"})).toBeVisible();
  await page.getByRole("button",{name:"Open Glass reference"}).click();
  await page.keyboard.press("Escape");await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Open Glass reference"})).toBeFocused();
  await page.keyboard.press("Enter");
  await page.getByRole("button",{name:"Edit details"}).click();
  await page.getByLabel("Title",{exact:true}).fill("Blue bottle");
  await page.getByRole("button",{name:"Save changes"}).click();
  await page.getByRole("button",{name:"Open Blue bottle"}).click();
  await page.getByRole("button",{name:"Move to Trash",exact:true}).click();
  await page.getByRole("button",{name:"Keep image"}).click();
  await expect(page.getByRole("button",{name:"Confirm move to Trash"})).toHaveCount(0);
  await page.getByRole("button",{name:"Move to Trash",exact:true}).click();
  await page.getByRole("button",{name:"Confirm move to Trash"}).click();
  await expect(page.getByRole("button",{name:"Open Blue bottle"})).toHaveCount(0);
  await page.getByLabel("Gallery options").click();
  await page.getByRole("button",{name:"Trash",exact:true}).click();
  await page.getByRole("button",{name:"Open Blue bottle"}).click();
  await page.getByRole("button",{name:"Restore image"}).click();
  await page.getByLabel("Gallery options").click();
  await page.getByRole("button",{name:"Library",exact:true}).click();
  await page.getByLabel("Gallery options").click();
  await expect(page.getByRole("button",{name:"Open Blue bottle"})).toBeVisible();
  await page.getByRole("searchbox").fill("no-match");
  await expect(page.getByText("No images match these filters.")).toBeVisible();
  await page.getByRole("button",{name:"Clear filters"}).first().click();
  await expect(page.getByRole("button",{name:"Open Blue bottle"})).toBeVisible();
  await page.getByRole("button",{name:"Dismiss notification"}).click();
  await page.getByLabel("Gallery options").click();
  await page.getByRole("button",{name:"Refresh",exact:true}).click();
  await expect(page.getByRole("button",{name:"Open Blue bottle"})).toBeVisible();
  expect(errors).toEqual([]);
});

test("empty states, mobile reflow, contrast, keyboard focus, and upload cancel", async ({page})=>{
  await backend(page);await page.setViewportSize({width:375,height:812});await page.goto("/");
  await expect(page.getByText("Your library starts with an image.")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const audit=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
  expect(audit.violations).toEqual([]);
  await page.screenshot({path:"test-results/mobile-empty.png",fullPage:true});
  await page.getByRole("button",{name:"Upload images",exact:true}).click();
  await page.getByRole("button",{name:"Cancel",exact:true}).click();
  await page.getByLabel("Gallery options").click();
  await page.getByRole("button",{name:"Trash",exact:true}).click();
  await expect(page.getByText("Nothing in Trash.")).toBeVisible();
  await page.setViewportSize({width:1440,height:900});
  await page.screenshot({path:"test-results/desktop-empty.png",fullPage:true});
});

test("load failures can be retried", async ({page})=>{
  await backend(page);
  let fail = true;
  await page.route("https://gallery.test/rest/v1/gallery_images**",async route=>{
    if(fail && new URL(route.request().url()).searchParams.get("select") !== "tags") {fail=false;return route.fulfill({status:500,contentType:"application/json",body:'{"message":"test failure"}'});}
    await route.fallback();
  });
  await page.goto("/");await expect(page.getByRole("heading",{name:"The library couldn’t load."})).toBeVisible();
  await page.getByRole("button",{name:"Try again"}).click();
  await expect(page.getByText("Your library starts with an image.")).toBeVisible();
});

test("pagination, collection filters, sorting, download, and populated mobile layout", async ({page})=>{
  const rows=Array.from({length:38},(_,i)=>({id:`fixture-${i}`,owner_id:"fixture-owner",storage_path:`fixture/image-${i}.png`,title:`Test reference ${String(i).padStart(2,"0")}`,filename:`test-${i}.png`,collection:i%2 ? "Test packaging" : "Test materials",tags:[i%2 ? "packaging" : "material"],mime_type:"image/png",bytes:100,width:600,height:i%2 ? 800 : 450,created_at:"2026-10-08T00:00:00Z",updated_at:"2026-10-08T00:00:00Z",deleted_at:null}));
  await backend(page,rows);await page.goto("/");
  await expect(page.locator(".tile")).toHaveCount(36);
  await page.getByRole("button",{name:"Load more images"}).click();
  await expect(page.locator(".tile")).toHaveCount(38);
  const tags=page.getByRole("navigation",{name:"Filter by tag"});
  await tags.getByRole("button",{name:"packaging",exact:true}).click();
  await expect(page.locator(".tile")).toHaveCount(19);
  await expect(tags.getByRole("button",{name:"packaging",exact:true})).toHaveAttribute("aria-pressed","true");
  await tags.getByRole("button",{name:"All images",exact:true}).click();
  await expect(page.locator(".tile")).toHaveCount(38);
  await expect(page.locator(".tile-title,.tile-collection")).toHaveCount(0);
  await page.getByLabel("Gallery options").click();
  await page.getByRole("combobox",{name:"Collection",exact:true}).selectOption("Test packaging");
  await expect(page.locator(".tile")).toHaveCount(19);
  await page.getByRole("combobox",{name:"Sort",exact:true}).selectOption("title");
  await expect(page.locator(".tile button").first()).toHaveAccessibleName("Open Test reference 01");
  await page.getByLabel("Gallery options").click();
  await page.getByRole("button",{name:"Open Test reference 01"}).click();
  const audit=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
  expect(audit.violations).toEqual([]);
  const download=page.waitForEvent("download");
  await page.getByRole("button",{name:"Download original"}).click();
  expect((await download).suggestedFilename()).toBe("test.png");
  await page.getByRole("button",{name:"Close dialog"}).click();
  for(const width of [320,375,768,1440]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.getByRole("button",{name:"Clear filters",exact:true}).click();
  await expect(page.locator(".active-filters")).toHaveCount(0);
  await page.setViewportSize({width:1440,height:900});
  await page.screenshot({path:"test-results/desktop-feed.png",fullPage:true});
  await page.setViewportSize({width:375,height:812});
  await page.screenshot({path:"test-results/mobile-feed.png",fullPage:true});
  await page.getByRole("button",{name:"Upload images",exact:true}).click();
  await page.locator('input[type="file"]').setInputFiles({name:"unsupported.svg",mimeType:"image/svg+xml",buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')});
  await page.getByRole("dialog").getByRole("button",{name:"Upload images",exact:true}).click();
  await expect(page.getByRole("alert")).toContainText("choose a JPG, PNG, WebP, or GIF");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole("button",{name:"Close dialog"}).click();
  await page.getByLabel("Gallery options").click();
  await page.getByRole("button",{name:"Sign out",exact:true}).click();
  await expect(page).toHaveURL(/\/login$/);
});
