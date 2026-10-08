import { defineConfig } from "@playwright/test";
export default defineConfig({testDir:"./tests/browser",fullyParallel:false,workers:1,reporter:"list",use:{baseURL:"http://127.0.0.1:4182",channel:"msedge",headless:true,screenshot:"only-on-failure"},webServer:{command:"node tests/harness-server.mjs",url:"http://127.0.0.1:4182",reuseExistingServer:false}});
