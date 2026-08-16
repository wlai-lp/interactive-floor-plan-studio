import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";

const chrome = process.env.CHROME;
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173";
if (!chrome) throw new Error("CHROME environment variable is required.");

const userDataDir = "/tmp/hafloorplan-landing-demo-chrome";
await rm(userDataDir, { recursive: true, force: true });
await mkdir(userDataDir, { recursive: true });

const chromeProcess = spawn(chrome, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--remote-debugging-port=9224",
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

let chromeStderr = "";
chromeProcess.stderr.on("data", chunk => { chromeStderr += chunk.toString(); });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForDebugger() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:9224/json/version");
      if (response.ok) return response.json();
    } catch {}
    await sleep(250);
  }
  throw new Error(`Chrome DevTools endpoint did not start.\n${chromeStderr}`);
}

const version = await waitForDebugger();
const socket = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const listeners = new Map();
const consoleMessages = [];
const logMessages = [];
const exceptions = [];

socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
    else waiter.resolve(message.result);
    return;
  }

  if (message.method === "Runtime.consoleAPICalled") {
    consoleMessages.push((message.params.args || []).map(arg => arg.value ?? arg.description ?? "").join(" "));
  }
  if (message.method === "Log.entryAdded") logMessages.push(message.params.entry?.text || "");
  if (message.method === "Runtime.exceptionThrown") {
    exceptions.push(message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text || "");
  }

  const key = `${message.sessionId || "browser"}:${message.method}`;
  const queue = listeners.get(key);
  if (queue?.length) queue.shift()(message.params);
});

function send(method, params = {}, sessionId) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function waitForEvent(method, sessionId) {
  const key = `${sessionId || "browser"}:${method}`;
  return new Promise(resolve => {
    const queue = listeners.get(key) || [];
    queue.push(resolve);
    listeners.set(key, queue);
  });
}

async function evaluate(expression, sessionId) {
  const { result } = await send("Runtime.evaluate", { expression, returnByValue: true }, sessionId);
  return result.value;
}

async function waitFor(expression, sessionId, description) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await evaluate(expression, sessionId)) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${description}.`);
}

try {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Runtime.enable", {}, sessionId);
  await send("Page.enable", {}, sessionId);
  await send("Log.enable", {}, sessionId);

  const loaded = waitForEvent("Page.loadEventFired", sessionId);
  await send("Page.navigate", { url: `${baseUrl}/` }, sessionId);
  await loaded;

  await waitFor(
    'document.querySelector(\'[data-short-demo="true"][data-demo-ready="true"]\') !== null',
    sessionId,
    "the short hero demo",
  );

  // Regression guard: the full promo must remain absent well after hydration.
  await sleep(7000);
  const initialState = await evaluate(`({
    trigger: !!document.querySelector('[data-full-demo-trigger="true"]'),
    dialog: !!document.querySelector('[role="dialog"]'),
    fullDemo: !!document.querySelector('[data-full-demo="true"]'),
    shortDemo: !!document.querySelector('[data-short-demo="true"]')
  })`, sessionId);
  if (!initialState.trigger || initialState.dialog || initialState.fullDemo || !initialState.shortDemo) {
    throw new Error(`Unexpected initial demo state: ${JSON.stringify(initialState)}`);
  }

  await evaluate('document.querySelector(\'[data-full-demo-trigger="true"]\').click()', sessionId);
  await waitFor('document.querySelector(\'[data-full-demo="true"][data-demo-ready="true"]\') !== null', sessionId, "the full promo");

  const openState = await evaluate(`({
    dialog: !!document.querySelector('[role="dialog"][aria-modal="true"]'),
    fullDemo: !!document.querySelector('[data-full-demo="true"]'),
    shortDemo: !!document.querySelector('[data-short-demo="true"]'),
    closeFocused: document.activeElement?.getAttribute('aria-label') === 'Close 33-second demo'
  })`, sessionId);
  if (!openState.dialog || !openState.fullDemo || openState.shortDemo || !openState.closeFocused) {
    throw new Error(`Unexpected open demo state: ${JSON.stringify(openState)}`);
  }

  const screenshot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  await writeFile("/tmp/landing-full-demo.png", Buffer.from(screenshot.data, "base64"));

  await evaluate('document.querySelector(\'[aria-label="Close 33-second demo"]\').click()', sessionId);
  await waitFor('document.querySelector(\'[data-short-demo="true"][data-demo-ready="true"]\') !== null', sessionId, "the remounted short hero");

  const closedState = await evaluate(`({
    dialog: !!document.querySelector('[role="dialog"]'),
    fullDemo: !!document.querySelector('[data-full-demo="true"]'),
    triggerFocused: document.activeElement?.matches('[data-full-demo-trigger="true"]') === true
  })`, sessionId);
  if (closedState.dialog || closedState.fullDemo || !closedState.triggerFocused) {
    throw new Error(`Unexpected closed demo state: ${JSON.stringify(closedState)}`);
  }

  await evaluate('document.querySelector(\'[data-full-demo-trigger="true"]\').click()', sessionId);
  await waitFor('document.querySelector(\'[data-full-demo="true"][data-demo-ready="true"]\') !== null', sessionId, "the reopened full promo");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" }, sessionId);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" }, sessionId);
  await waitFor('document.querySelector(\'[role="dialog"]\') === null', sessionId, "Escape to close the promo");

  const browserOutput = [...consoleMessages, ...logMessages, ...exceptions].join("\n");
  if (/Unable to start the HAFloorplan|Hydration failed|hydration mismatch/i.test(browserOutput)) {
    throw new Error(`Landing demo runtime error detected:\n${browserOutput}`);
  }
  await writeFile("/tmp/landing-demo-browser.log", browserOutput || "No landing demo runtime errors captured.\n");
} finally {
  socket.close();
  chromeProcess.kill("SIGTERM");
}
