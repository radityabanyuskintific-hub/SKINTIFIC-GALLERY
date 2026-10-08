import { build } from "esbuild";
import { createServer } from "node:http";

const result = await build({entryPoints:["tests/harness.tsx"],bundle:true,write:false,outdir:"test-results/harness",platform:"browser",format:"iife",define:{"process.env.NODE_ENV":'"development"',"process.env.NEXT_PUBLIC_SUPABASE_URL":'"https://gallery.test"',"process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY":'"test-only-publishable-key"',"process.env":"{}"},logLevel:"error"});
const script = result.outputFiles.find(file=>file.path.endsWith(".js")).text;
const css = result.outputFiles.find(file=>file.path.endsWith(".css")).text;
createServer((req,res)=>{
  if(req.url === "/test.js") {res.setHeader("Content-Type","text/javascript");res.end(script);}
  else if(req.url === "/test.css") {res.setHeader("Content-Type","text/css");res.end(css);}
  else {res.setHeader("Content-Type","text/html");res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gallery browser test harness</title><link rel="stylesheet" href="/test.css"></head><body><div id="root"></div><script src="/test.js"></script></body></html>');}
}).listen(4182,"127.0.0.1");
