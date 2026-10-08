import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_BYTES, parseTags, validateFile, validateMetadata } from "../src/lib/images.ts";

test("rejects unsupported, empty, and oversized uploads", () => {
  for (const file of [{name:"x.svg",type:"image/svg+xml",size:10}, {name:"x.png",type:"image/png",size:0}, {name:"x.jpg",type:"image/jpeg",size:MAX_BYTES+1}]) assert.throws(() => validateFile(file));
  assert.doesNotThrow(() => validateFile({name:"x.webp",type:"image/webp",size:MAX_BYTES}));
});
test("normalizes tags and enforces metadata boundaries", () => {
  assert.deepEqual(parseTags(" Glass, blue, GLASS, , " ), ["glass","blue"]);
  assert.throws(() => parseTags("a".repeat(41)));
  assert.throws(() => parseTags(Array.from({length:21},(_,i) => `tag${i}`).join(",")));
  assert.throws(() => validateMetadata("   ", ""));
  assert.throws(() => validateMetadata("Image", "a".repeat(81)));
});
