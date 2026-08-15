# SSR hydration mismatch note

Root cause identified in `app/page.tsx`: client-only state is read during render-time `useState` initialization. The server renders without `window`/`localStorage`, while the browser's first render reads them, so the initial trees can differ before hydration.

Observed mismatch:

- server: `<svg ... aria-label="Floor plan editor">`
- client: `<div class="ha-welcome-anchor ...">`

The immediate trigger is the Home Assistant welcome state, but the saved-project and URL-selection initializers use the same unsafe pattern.

## Required fix

Use a deterministic SSR-safe first render, then load browser-only state in `useEffect` after mount.

Recommended shape:

```tsx
const [project, setProject] = useState<Project>(DEMO);
const [loadNotice, setLoadNotice] = useState("");
const [autosaveEnabled, setAutosaveEnabled] = useState(false);
const [selected, setSelected] = useState("living");
const [selectedDevice, setSelectedDevice] = useState("");
const [welcomeVisible, setWelcomeVisible] = useState(false);
const [hydrated, setHydrated] = useState(false);

useEffect(() => {
  let loadedProject = DEMO;
  let notice = "";
  let autosave = true;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const result = migrateProject(JSON.parse(raw));
      loadedProject = result.project as Project;
      if (result.migrated && !localStorage.getItem(V1_BACKUP_KEY)) {
        localStorage.setItem(V1_BACKUP_KEY, raw);
      }
      if (result.migrated) {
        notice = "Legacy project upgraded to schema v2. A v1 backup was retained.";
      }
    } catch (error) {
      notice = `Saved project was not overwritten because it could not be loaded: ${error instanceof Error ? error.message : "invalid project"}`;
      autosave = false;
    }
  }

  const requestedDeviceId = new URLSearchParams(window.location.search).get("device");
  const requestedDevice = loadedProject.devices.find(item => item.id === requestedDeviceId);
  const welcomeAllowed = loadedProject.devices.some(device => device.type === "light") && localStorage.getItem(WELCOME_KEY) !== "true";
  const welcomeDevice = welcomeAllowed ? loadedProject.devices.find(item => item.type === "light") : undefined;

  setProject(loadedProject);
  setLoadNotice(notice);
  setAutosaveEnabled(autosave);

  if (requestedDevice) {
    setSelected(requestedDevice.roomId);
    setSelectedDevice(requestedDevice.id);
  } else if (welcomeDevice) {
    setSelected(welcomeDevice.roomId);
    setSelectedDevice(welcomeDevice.id);
  }

  setWelcomeVisible(welcomeAllowed);
  setHydrated(true);
}, []);
```

Also guard autosave until browser state has been loaded:

```tsx
useEffect(() => {
  if (!hydrated || !autosaveEnabled) return;
  // existing autosave logic
}, [project, autosaveEnabled, hydrated]);
```

Do not use `suppressHydrationWarning`; that hides the symptom instead of fixing the inconsistent initial tree.
