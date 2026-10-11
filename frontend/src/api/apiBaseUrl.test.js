import assert from "node:assert/strict";
import test from "node:test";
import axios from "axios";
import { resolveApiBaseUrl } from "./apiBaseUrl.js";

test("adds the API prefix to the production backend origin", () => {
  assert.equal(
    resolveApiBaseUrl("https://fikrnot-4xsa.onrender.com", false),
    "https://fikrnot-4xsa.onrender.com/api",
  );
});

test("does not duplicate an API prefix already in the configured URL", () => {
  assert.equal(
    resolveApiBaseUrl("https://fikrnot-4xsa.onrender.com/api/", false),
    "https://fikrnot-4xsa.onrender.com/api",
  );
});

test("uses localhost only for an unconfigured development build", () => {
  assert.equal(
    resolveApiBaseUrl("", true),
    "http://localhost:5000/api",
  );
});

test("uses the deployed backend for an unconfigured production build", () => {
  assert.equal(
    resolveApiBaseUrl("", false),
    "https://fikrnot-4xsa.onrender.com/api",
  );
});

test("does not allow a production build to target a loopback API URL", () => {
  assert.equal(
    resolveApiBaseUrl("http://localhost:5000/api", false),
    "https://fikrnot-4xsa.onrender.com/api",
  );
});

test("resolves login and hostel requests to the existing /api routes", () => {
  const client = axios.create({
    baseURL: resolveApiBaseUrl("https://fikrnot-4xsa.onrender.com", false),
  });

  assert.equal(
    client.getUri({ url: "/auth/login" }),
    "https://fikrnot-4xsa.onrender.com/api/auth/login",
  );
  assert.equal(
    client.getUri({ url: "/hostels" }),
    "https://fikrnot-4xsa.onrender.com/api/hostels",
  );
});
