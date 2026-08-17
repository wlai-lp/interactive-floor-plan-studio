import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";

const chrome = process.env.CHROME;
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173";
if (!chrome) throw new Error("CHROME environment variable is required.");

const userDataDir = "/tmp/hafloorplan-duplicate-entity-chrome";
await rm(userDataDir, { recursive: true, force: true });
await mkdir(userDataDir, { recursive: true });

const chromeProcess = spawn(chrome, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--window-size=1536,1000",
  "--remote-debugging-port=9225",
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

let chromeStderr = "";
chromeProcess.stderr.on("data", chunk => { chromeStderr += chunk.toString(); });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForDebugger() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:9225/json/version");
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

async function navigate(url, sessionId) {
  const loaded = waitForEvent("Page.loadEventFired", sessionId);
  await send("Page.navigate", { url }, sessionId);
  await loaded;
}

async function evaluate(expression, sessionId) {
  const { result } = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
  return result.value;
}

async function waitForEntityState(sessionId, predicate, description, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  let lastState = null;
  while (Date.now() < deadline) {
    lastState = await evaluate(`(() => {
      const input = document.querySelector('#ha-entity-id');
      if (!input) return null;
      return {
        value: input.value,
        invalid: input.classList.contains('invalid'),
        ariaInvalid: input.getAttribute('aria-invalid'),
        errorText: document.querySelector('#entity-error')?.textContent || ''
      };
    })()`, sessionId);
    if (lastState && predicate(lastState)) return lastState;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${description}. Last state: ${JSON.stringify(lastState)}`);
}

const haConfig = (entityId, title) => ({
  entityId,
  title,
  mode: "icon-and-label",
  label: { enabled: true, offsetY: 44, fontSizePx: 14, color: "#ffffff" },
  icon: "",
  iconSizePx: 40,
  tapAction: { action: "toggle" },
  holdAction: { action: "more-info" },
  doubleTapAction: { action: "none" },
});

const project = {
  schemaVersion: 2,
  name: "Duplicate Entity Browser QA",
  width: 1000,
  height: 620,
  image: "",
  rooms: [
    { id: "room-a", name: "Room A", color: "#ffb86b", light: false, temperature: 70, points: [{ x: 20, y: 20 }, { x: 450, y: 20 }, { x: 450, y: 500 }, { x: 20, y: 500 }] },
    { id: "room-b", name: "Room B", color: "#75d6b5", light: false, temperature: 70, points: [{ x: 520, y: 20 }, { x: 950, y: 20 }, { x: 950, y: 500 }, { x: 520, y: 500 }] },
  ],
  devices: [
    { id: "device-a", roomId: "room-a", x: 220, y: 220, type: "light", ha: haConfig("light.alarm_light", "Room A light") },
    { id: "device-b", roomId: "room-b", x: 720, y: 220, type: "light", ha: haConfig("light.alarm_light", "Room B light") },
  ],
  homeAssistant: {
    background: "rooms-and-uploaded-image",
    overlays: [{ id: "overlay-device-a", entityId: "light.alarm_light", state: "on", roomIds: ["room-a"], fill: "#ffd166", opacity: 0.35, blurPx: 8, mappingSource: "inferred" }],
  },
};

try {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Runtime.enable", {}, sessionId);
  await send("Page.enable", {}, sessionId);
  await send("Log.enable", {}, sessionId);

  await navigate(`${baseUrl}/editor`, sessionId);
  await waitForEntityState(sessionId, state => Boolean(state.value !== undefined), "initial editor mount");
  await evaluate(`localStorage.setItem("floor-plan-studio-project", ${JSON.stringify(JSON.stringify(project))}); localStorage.setItem("floor-plan-studio-ha-welcome-dismissed", "true");`, sessionId);

  await navigate(`${baseUrl}/editor?device=device-a`, sessionId);
  const firstState = await waitForEntityState(
    sessionId,
    state => state.value === "light.alarm_light" && state.invalid && state.ariaInvalid === "true" && state.errorText.includes("Duplicate Entity ID"),
    "first duplicate device validation",
  );
  if (!firstState.errorText.includes("Each device must use a unique Home Assistant Entity ID")) {
    throw new Error(`Duplicate guidance was incomplete: ${JSON.stringify(firstState)}`);
  }

  await navigate(`${baseUrl}/editor?device=device-b`, sessionId);
  await waitForEntityState(
    sessionId,
    state => state.value === "light.alarm_light" && state.invalid && state.ariaInvalid === "true" && state.errorText.includes("Duplicate Entity ID"),
    "second duplicate device validation",
  );

  const duplicateScreenshot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  await writeFile("/tmp/duplicate-entity-id.png", Buffer.from(duplicateScreenshot.data, "base64"));

  await evaluate(`(() => {
    const input = document.querySelector('#ha-entity-id');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'light.room_b');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`, sessionId);

  await waitForEntityState(
    sessionId,
    state => state.value === "light.room_b" && !state.invalid && state.ariaInvalid !== "true" && !state.errorText.includes("Duplicate Entity ID"),
    "corrected Entity ID validation to clear",
  );

  // Wait past the editor autosave debounce before reloading another selected device.
  await sleep(500);
  await navigate(`${baseUrl}/editor?device=device-a`, sessionId);
  await waitForEntityState(
    sessionId,
    state => state.value === "light.alarm_light" && !state.invalid && state.ariaInvalid !== "true" && !state.errorText.includes("Duplicate Entity ID"),
    "remaining device validation to clear after correction",
  );

  const browserOutput = [...consoleMessages, ...logMessages, ...exceptions].join("\n");
  if (/uncaught|TypeError|ReferenceError|Hydration failed|hydration mismatch/i.test(browserOutput)) {
    throw new Error(`Unexpected browser runtime error:\n${browserOutput}`);
  }

  await writeFile("/tmp/duplicate-entity-id-browser.log", browserOutput || "Duplicate Entity ID UI guardrail passed with no runtime errors.\n");
} finally {
  socket.close();
  chromeProcess.kill("SIGTERM");
}
