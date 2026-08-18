import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";

const chrome = process.env.CHROME;
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173";
if (!chrome) throw new Error("CHROME environment variable is required.");

const userDataDir = "/tmp/hafloorplan-about-chrome";
await rm(userDataDir, { recursive: true, force: true });
await mkdir(userDataDir, { recursive: true });

const chromeProcess = spawn(chrome, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--window-size=1536,1000",
  "--remote-debugging-port=9227",
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

let chromeStderr = "";
chromeProcess.stderr.on("data", chunk => { chromeStderr += chunk.toString(); });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForDebugger() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:9227/json/version");
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
  if (message.method === "Runtime.consoleAPICalled") consoleMessages.push((message.params.args || []).map(arg => arg.value ?? arg.description ?? "").join(" "));
  if (message.method === "Log.entryAdded") logMessages.push(message.params.entry?.text || "");
  if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text || "");
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

try {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Runtime.enable", {}, sessionId);
  await send("Page.enable", {}, sessionId);
  await send("Log.enable", {}, sessionId);

  const loaded = waitForEvent("Page.loadEventFired", sessionId);
  await send("Page.navigate", { url: `${baseUrl}/about` }, sessionId);
  await loaded;
  await sleep(1000);

  const { result } = await send("Runtime.evaluate", {
    expression: `(() => ({
      text: document.body.innerText,
      openEditorHref: Array.from(document.querySelectorAll('a')).find(a => a.textContent?.trim() === 'Open Editor')?.getAttribute('href'),
      mainCount: document.querySelectorAll('main#main-content').length,
      h1Count: document.querySelectorAll('h1').length
    }))()`,
    returnByValue: true,
  }, sessionId);
  const state = result.value || {};

  const requiredText = [
    "The visual authoring layer for Home Assistant Picture Elements.",
    "Why it exists",
    "What we believe",
    "What HAFloorplan is—and what it is not",
    "Acknowledgements",
    "Home Assistant",
    "Floorplanner",
    "Northflank",
    "not affiliated with or endorsed by Home Assistant or Nabu Casa",
  ];
  for (const text of requiredText) {
    if (!state.text?.toLowerCase().includes(text.toLowerCase())) throw new Error(`About page missing rendered text: ${text}`);
  }
  if (state.openEditorHref !== "/editor") throw new Error(`Open Editor CTA has unexpected href: ${state.openEditorHref}`);
  if (state.mainCount !== 1) throw new Error(`Expected one shared marketing main landmark, found ${state.mainCount}`);
  if (state.h1Count !== 1) throw new Error(`Expected one H1, found ${state.h1Count}`);

  const browserOutput = [...consoleMessages, ...logMessages, ...exceptions].join("\n");
  if (/Hydration failed|hydration mismatch|server rendered text didn't match|uncaught|TypeError|ReferenceError/i.test(browserOutput)) {
    throw new Error(`Unexpected About page browser runtime error:\n${browserOutput}`);
  }

  const screenshot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  await writeFile("/tmp/about.png", Buffer.from(screenshot.data, "base64"));
  await writeFile("/tmp/about-browser.log", browserOutput || "About page rendered with no hydration/runtime errors.\n");
} finally {
  socket.close();
  chromeProcess.kill("SIGTERM");
}
