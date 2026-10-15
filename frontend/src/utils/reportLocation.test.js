import test from "node:test";
import assert from "node:assert/strict";
import { buildReportLocation, validateReportLocation } from "./reportLocation.js";

test("manual landmarks validate after trimming; optional details are separate", () => {
  assert.equal(validateReportLocation({ mode: "manual", area: "  Library  " }), "");
  assert.match(validateReportLocation({ mode: "manual", area: "   " }), /landmark/);
  assert.match(validateReportLocation({ mode: "", area: "", description: "college" }), /method/);
});

test("map locations require a confirmed, valid point and landmark", () => {
  assert.match(validateReportLocation({ mode: "map", coordinates: [73.3, 22.2], confirmed: false }), /confirm/);
  assert.match(validateReportLocation({ mode: "map", area: "Library", coordinates: [181, 22], confirmed: true }), /map/);
  assert.equal(validateReportLocation({ mode: "map", coordinates: [73.3, 22.2], confirmed: true }), "");
});

test("manual entry remains independent from map coordinates", () => {
  assert.equal(validateReportLocation({ mode: "manual", area: "Library", coordinates: null }), "");
  assert.match(validateReportLocation({ mode: "manual", area: "", coordinates: [73.3, 22.2], confirmed: true }), /landmark/);
});

test("payload trims location labels and only sends coordinates for map mode", () => {
  assert.deepEqual(buildReportLocation({ mode: "manual", area: " Library " }), { area: "Library" });
  assert.deepEqual(buildReportLocation({ mode: "map", area: " Library ", coordinates: ["73.3", "22.2"] }), {
    area: "Library", type: "Point", coordinates: [73.3, 22.2],
  });
  assert.deepEqual(buildReportLocation({ mode: "map", area: "", coordinates: [73.3, 22.2] }), {
    area: "Map point (22.200000, 73.300000)", type: "Point", coordinates: [73.3, 22.2],
  });
});
