import { app, BrowserWindow, screen, shell, ipcMain } from "electron"
import path from "path"
import fs from "fs"
import { initializeIpcHandlers } from "./ipcHandlers"
import { ProcessingHelper } from "./ProcessingHelper"
import { ScreenshotHelper } from "./ScreenshotHelper"
import { ShortcutsHelper } from "./shortcuts"
import { initAutoUpdater } from "./autoUpdater"
import { configHelper } from "./ConfigHelper"
import * as dotenv from "dotenv"

let deeplinkUrl: string | null = null;
let pendingTokens: { access_token: string, refresh_token: string } | null = null;

// Constants
const isDev = process.env.NODE_ENV === "development"

// Application State
const state = {
  // Window management properties
  mainWindow: null as BrowserWindow | null,
  isWindowVisible: false,
  windowPosition: null as { x: number; y: number } | null,
  windowSize: null as { width: number; height: number } | null,
  screenWidth: 0,
  screenHeight: 0,
  step: 0,
  currentX: 0,
  currentY: 0,

  // Application helpers
  screenshotHelper: null as ScreenshotHelper | null,
  shortcutsHelper: null as ShortcutsHelper | null,
  processingHelper: null as ProcessingHelper | null,

  // View and state management
  view: "queue" as "queue" | "solutions" | "debug",
  problemInfo: null as any,
  hasDebugged: false,

  // Processing events
  PROCESSING_EVENTS: {
    UNAUTHORIZED: "processing-unauthorized",
    NO_SCREENSHOTS: "processing-no-screenshots",
    OUT_OF_CREDITS: "out-of-credits",
    API_KEY_INVALID: "api-key-invalid",
    INITIAL_START: "initial-start",
    PROBLEM_EXTRACTED: "problem-extracted",
    SOLUTION_SUCCESS: "solution-success",
    INITIAL_SOLUTION_ERROR: "solution-error",
    DEBUG_START: "debug-start",
    DEBUG_SUCCESS: "debug-success",
    DEBUG_ERROR: "debug-error"
  } as const
}

// Add interfaces for helper classes
export interface IProcessingHelperDeps {
  getScreenshotHelper: () => ScreenshotHelper | null
  getMainWindow: () => BrowserWindow | null
  getView: () => "queue" | "solutions" | "debug"
  setView: (view: "queue" | "solutions" | "debug") => void
  getProblemInfo: () => any
  setProblemInfo: (info: any) => void
  getScreenshotQueue: () => string[]
  getExtraScreenshotQueue: () => string[]
  clearQueues: () => void
  takeScreenshot: () => Promise<string>
  getImagePreview: (filepath: string) => Promise<string>
  deleteScreenshot: (
    path: string
  ) => Promise<{ success: boolean; error?: string }>
  setHasDebugged: (value: boolean) => void
  getHasDebugged: () => boolean
  PROCESSING_EVENTS: typeof state.PROCESSING_EVENTS
}

export interface IShortcutsHelperDeps {
  getMainWindow: () => BrowserWindow | null
  takeScreenshot: () => Promise<string>
  getImagePreview: (filepath: string) => Promise<string>
  processingHelper: ProcessingHelper | null
  clearQueues: () => void
  setView: (view: "queue" | "solutions" | "debug") => void
  isVisible: () => boolean
  toggleMainWindow: () => void
  moveWindowLeft: () => void
  moveWindowRight: () => void
  moveWindowUp: () => void
  moveWindowDown: () => void
}

export interface IIpcHandlerDeps {
  getMainWindow: () => BrowserWindow | null
  setWindowDimensions: (width: number, height: number) => void
  getScreenshotQueue: () => string[]
  getExtraScreenshotQueue: () => string[]
  deleteScreenshot: (
    path: string
  ) => Promise<{ success: boolean; error?: string }>
  getImagePreview: (filepath: string) => Promise<string>
  processingHelper: ProcessingHelper | null
  PROCESSING_EVENTS: typeof state.PROCESSING_EVENTS
  takeScreenshot: () => Promise<string>
  getView: () => "queue" | "solutions" | "debug"
  toggleMainWindow: () => void
  clearQueues: () => void
  setView: (view: "queue" | "solutions" | "debug") => void
  moveWindowLeft: () => void
  moveWindowRight: () => void
  moveWindowUp: () => void
  moveWindowDown: () => void
}

// macOS: Handle protocol when app is already running
app.on("open-url", (event, url) => {
  event.preventDefault();
  deeplinkUrl = url;
  handleAuthCallback(url);
});

// Windows: Handle protocol when app is launched via protocol
if (process.platform === "win32" && process.argv.length >= 2) {
  const url = process.argv.find(arg => arg.startsWith("interview-coder://"));
  if (url) {
    deeplinkUrl = url;
    // If app is ready, handle immediately; otherwise, wait for app to be ready
    app.once("ready", () => handleAuthCallback(url));
  }
}

// Function to handle the auth callback
// function handleAuthCallback(url: string) {
//   console.log("Custom protocol URL received:", url);
//   // TODO: Parse tokens and send to renderer process
//   // Example: interview-coder://auth-callback#access_token=...&refresh_token=...
//   // You can use URL and URLSearchParams to parse the hash
// }

function handleAuthCallback(url: string) {
  console.log("Custom protocol URL received:", url);

  // Extract the hash part
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) {
    console.error("No hash found in callback URL");
    return;
  }
  const hash = url.substring(hashIndex + 1); // skip the '#'
  const params = new URLSearchParams(hash);

  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");

  if (!access_token || !refresh_token) {
    console.error("Tokens not found in callback URL");
    return;
  }

  // Now send these tokens to your renderer process (see below)
  sendTokensToRenderer(access_token, refresh_token);
}

// Helper to send tokens to renderer
function sendTokensToRenderer(access_token: string, refresh_token: string) {
  console.log("Sending tokens to renderer:", access_token, refresh_token);
  // if (state.mainWindow) {
  //   state.mainWindow.webContents.send("auth-tokens", { access_token, refresh_token });
  //   // Optionally, focus the window
  //   state.mainWindow.focus();
  // }

  if (state.mainWindow) {
    state.mainWindow.webContents.send("auth-tokens", { access_token, refresh_token });
    state.mainWindow.focus();
    pendingTokens = null; // Clear after sending
  } else {
    // Store for later
    pendingTokens = { access_token, refresh_token };
    console.log("Main window not ready, storing tokens for later.");
  }
}



// Add this function in electron/main.ts
function openLoginPage() {
  shell.openExternal("https://invisible-assistant.vercel.app");
}

// Initialize helpers
function initializeHelpers() {
  state.screenshotHelper = new ScreenshotHelper(state.view)
  state.processingHelper = new ProcessingHelper({
    getScreenshotHelper,
    getMainWindow,
    getView,
    setView,
    getProblemInfo,
    setProblemInfo,
    getScreenshotQueue,
    getExtraScreenshotQueue,
    clearQueues,
    takeScreenshot,
    getImagePreview,
    deleteScreenshot,
    setHasDebugged,
    getHasDebugged,
    PROCESSING_EVENTS: state.PROCESSING_EVENTS
  } as IProcessingHelperDeps)
  state.shortcutsHelper = new ShortcutsHelper({
    getMainWindow,
    takeScreenshot,
    getImagePreview,
    processingHelper: state.processingHelper,
    clearQueues,
    setView,
    isVisible: () => state.isWindowVisible,
    toggleMainWindow,
    moveWindowLeft: () =>
      moveWindowHorizontal((x) =>
        Math.max(-(state.windowSize?.width || 0) / 2, x - state.step)
      ),
    moveWindowRight: () =>
      moveWindowHorizontal((x) =>
        Math.min(
          state.screenWidth - (state.windowSize?.width || 0) / 2,
          x + state.step
        )
      ),
    moveWindowUp: () => moveWindowVertical((y) => y - state.step),
    moveWindowDown: () => moveWindowVertical((y) => y + state.step)
  } as IShortcutsHelperDeps)
}

// Auth callback handler

if (process.platform === "darwin") {
  app.setAsDefaultProtocolClient("interview-coder");
} else {
  // On Windows, you may need to specify the exe and arguments
  app.setAsDefaultProtocolClient("interview-coder", process.execPath, [
    path.resolve(process.argv[1] || "")
  ]);
}

// Handle the protocol. In this case, we choose to show an Error Box.
if (process.defaultApp && process.argv.length >= 2) {
  app.setAsDefaultProtocolClient("interview-coder", process.execPath, [
    path.resolve(process.argv[1])
  ])
}

// Force Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on("second-instance", (event, commandLine) => {
    // Someone tried to run a second instance, we should focus our window.
    if (state.mainWindow) {
      if (state.mainWindow.isMinimized()) state.mainWindow.restore()
      state.mainWindow.focus()

      // Protocol handler removed - no longer using auth callbacks
    }
  })
}

// Auth callback removed as we no longer use Supabase authentication

// Window management functions
async function createWindow(): Promise<void> {
  if (state.mainWindow) {
    if (state.mainWindow.isMinimized()) state.mainWindow.restore()
    state.mainWindow.focus()
    return
  }

  const primaryDisplay = screen.getPrimaryDisplay()
  const workArea = primaryDisplay.workAreaSize
  state.screenWidth = workArea.width
  state.screenHeight = workArea.height
  state.step = 60
  state.currentY = 50

  const windowSettings: Electron.BrowserWindowConstructorOptions = {
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 550,
    x: state.currentX,
    y: 50,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: isDev
        ? path.join(__dirname, "../dist-electron/preload.js")
        : path.join(__dirname, "preload.js"),
      scrollBounce: true
    },
    show: true,
    frame: false,
    transparent: true,
    fullscreenable: false,
    hasShadow: false,
    opacity: 1.0,  // Start with full opacity
    backgroundColor: "#00000000",
    focusable: true,
    skipTaskbar: true,
    type: "panel",
    paintWhenInitiallyHidden: true,
    titleBarStyle: "hidden",
    enableLargerThanScreen: true,
    movable: true
  }

  state.mainWindow = new BrowserWindow(windowSettings)

  // Add more detailed logging for window events
  state.mainWindow.webContents.on("did-finish-load", () => {
    console.log("Window finished loading")
  })
  state.mainWindow.webContents.on(
    "did-fail-load",
    async (event, errorCode, errorDescription) => {
      console.error("Window failed to load:", errorCode, errorDescription)
      if (isDev) {
        // In development, retry loading after a short delay
        console.log("Retrying to load development server...")
        setTimeout(() => {
          state.mainWindow?.loadURL("http://localhost:54321").catch((error) => {
            console.error("Failed to load dev server on retry:", error)
          })
        }, 1000)
      }
    }
  )

  if (isDev) {
    // In development, load from the dev server
    console.log("Loading from development server: http://localhost:54321")
    state.mainWindow.loadURL("http://localhost:54321").catch((error) => {
      console.error("Failed to load dev server, falling back to local file:", error)
      // Fallback to local file if dev server is not available
      const indexPath = path.join(__dirname, "../dist/index.html")
      console.log("Falling back to:", indexPath)
      if (fs.existsSync(indexPath)) {
        state.mainWindow.loadFile(indexPath)
      } else {
        console.error("Could not find index.html in dist folder")
      }
    })
  } else {
    // In production, load from the built files
    const indexPath = path.join(__dirname, "../dist/index.html")
    console.log("Loading production build:", indexPath)
    
    if (fs.existsSync(indexPath)) {
      state.mainWindow.loadFile(indexPath)
    } else {
      console.error("Could not find index.html in dist folder")
    }
  }

  // Configure window behavior
  state.mainWindow.webContents.setZoomFactor(1)
  if (isDev) {
    state.mainWindow.webContents.openDevTools()
  }
  state.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log("Attempting to open URL:", url)
    try {
      const parsedURL = new URL(url);
      const hostname = parsedURL.hostname;
      const allowedHosts = ["google.com", "supabase.co"];
      if (allowedHosts.includes(hostname) || hostname.endsWith(".google.com") || hostname.endsWith(".supabase.co")) {
        shell.openExternal(url);
        return { action: "deny" }; // Do not open this URL in a new Electron window
      }
    } catch (error) {
      console.error("Invalid URL %d in setWindowOpenHandler: %d" , url , error);
      return { action: "deny" }; // Deny access as URL string is malformed or invalid
    }
    return { action: "allow" };
  })

  // Enhanced screen capture resistance
  state.mainWindow.setContentProtection(true)

  state.mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true
  })
  state.mainWindow.setAlwaysOnTop(true, "screen-saver", 1)

  // Additional screen capture resistance settings
  if (process.platform === "darwin") {
    // Prevent window from being captured in screenshots
    state.mainWindow.setHiddenInMissionControl(true)
    state.mainWindow.setWindowButtonVisibility(false)
    state.mainWindow.setBackgroundColor("#00000000")

    // Prevent window from being included in window switcher
    state.mainWindow.setSkipTaskbar(true)

    // Disable window shadow
    state.mainWindow.setHasShadow(false)
  }

  // Prevent the window from being captured by screen recording
  state.mainWindow.webContents.setBackgroundThrottling(false)
  state.mainWindow.webContents.setFrameRate(60)

  // Set up window listeners
  state.mainWindow.on("move", handleWindowMove)
  state.mainWindow.on("resize", handleWindowResize)
  state.mainWindow.on("closed", handleWindowClosed)

  // Initialize window state
  const bounds = state.mainWindow.getBounds()
  state.windowPosition = { x: bounds.x, y: bounds.y }
  state.windowSize = { width: bounds.width, height: bounds.height }
  state.currentX = bounds.x
  state.currentY = bounds.y
  state.isWindowVisible = true
  
  // Set opacity based on user preferences or hide initially
  // Ensure the window is visible for the first launch or if opacity > 0.1
  const savedOpacity = configHelper.getOpacity();
  console.log(`Initial opacity from config: ${savedOpacity}`);
  
  // Always make sure window is shown first
  state.mainWindow.showInactive(); // Use showInactive for consistency
  
  if (savedOpacity <= 0.1) {
    console.log('Initial opacity too low, setting to 0 and hiding window');
    state.mainWindow.setOpacity(0);
    state.isWindowVisible = false;
  } else {
    console.log(`Setting initial opacity to ${savedOpacity}`);
    state.mainWindow.setOpacity(savedOpacity);
    state.isWindowVisible = true;
  }

  if (pendingTokens) {
    state.mainWindow.webContents.send("auth-tokens", pendingTokens);
    state.mainWindow.focus();
    pendingTokens = null;
    console.log("Sent pending tokens to renderer after window creation.");
  }
  // state.mainWindow.setIgnoreMouseEvents(true, { forward: true });
}

function handleWindowMove(): void {
  if (!state.mainWindow) return
  const bounds = state.mainWindow.getBounds()
  state.windowPosition = { x: bounds.x, y: bounds.y }
  state.currentX = bounds.x
  state.currentY = bounds.y
}

function handleWindowResize(): void {
  if (!state.mainWindow) return
  const bounds = state.mainWindow.getBounds()
  state.windowSize = { width: bounds.width, height: bounds.height }
}

function handleWindowClosed(): void {
  state.mainWindow = null
  state.isWindowVisible = false
  state.windowPosition = null
  state.windowSize = null
}

// Window visibility functions
function hideMainWindow(): void {
  if (!state.mainWindow?.isDestroyed()) {
    const bounds = state.mainWindow.getBounds();
    state.windowPosition = { x: bounds.x, y: bounds.y };
    state.windowSize = { width: bounds.width, height: bounds.height };
    state.mainWindow.setIgnoreMouseEvents(true, { forward: true });
    state.mainWindow.setOpacity(0);
    state.isWindowVisible = false;
    console.log('Window hidden, opacity set to 0');
  }
}

function showMainWindow(): void {
  if (!state.mainWindow?.isDestroyed()) {
    if (state.windowPosition && state.windowSize) {
      state.mainWindow.setBounds({
        ...state.windowPosition,
        ...state.windowSize
      });
    }
    state.mainWindow.setIgnoreMouseEvents(false);
    // state.mainWindow.setIgnoreMouseEvents(true, { forward: true });
    state.mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
    state.mainWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true
    });
    state.mainWindow.setContentProtection(true);
    state.mainWindow.setOpacity(0); // Set opacity to 0 before showing
    state.mainWindow.showInactive(); // Use showInactive instead of show+focus
    state.mainWindow.setOpacity(1); // Then set opacity to 1 after showing
    state.isWindowVisible = true;
    console.log('Window shown with showInactive(), opacity set to 1');
  }
}

function toggleMainWindow(): void {
  console.log(`Toggling window. Current state: ${state.isWindowVisible ? 'visible' : 'hidden'}`);
  if (state.isWindowVisible) {
    hideMainWindow();
  } else {
    showMainWindow();
  }
}

// Window movement functions
function moveWindowHorizontal(updateFn: (x: number) => number): void {
  if (!state.mainWindow) return
  state.currentX = updateFn(state.currentX)
  state.mainWindow.setPosition(
    Math.round(state.currentX),
    Math.round(state.currentY)
  )
}

function moveWindowVertical(updateFn: (y: number) => number): void {
  if (!state.mainWindow) return

  const newY = updateFn(state.currentY)
  // Allow window to go 2/3 off screen in either direction
  const maxUpLimit = (-(state.windowSize?.height || 0) * 2) / 3
  const maxDownLimit =
    state.screenHeight + ((state.windowSize?.height || 0) * 2) / 3

  // Log the current state and limits
  console.log({
    newY,
    maxUpLimit,
    maxDownLimit,
    screenHeight: state.screenHeight,
    windowHeight: state.windowSize?.height,
    currentY: state.currentY
  })

  // Only update if within bounds
  if (newY >= maxUpLimit && newY <= maxDownLimit) {
    state.currentY = newY
    state.mainWindow.setPosition(
      Math.round(state.currentX),
      Math.round(state.currentY)
    )
  }
}

// Window dimension functions
function setWindowDimensions(width: number, height: number): void {
  if (!state.mainWindow?.isDestroyed()) {
    const [currentX, currentY] = state.mainWindow.getPosition()
    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workAreaSize
    const maxWidth = Math.floor(workArea.width * 0.5)

    state.mainWindow.setBounds({
      x: Math.min(currentX, workArea.width - maxWidth),
      y: currentY,
      width: Math.min(width + 32, maxWidth),
      height: Math.ceil(height)
    })
  }
}

// Environment setup
function loadEnvVariables() {
  if (isDev) {
    console.log("Loading env variables from:", path.join(process.cwd(), ".env"))
    dotenv.config({ path: path.join(process.cwd(), ".env") })
  } else {
    console.log(
      "Loading env variables from:",
      path.join(process.resourcesPath, ".env")
    )
    dotenv.config({ path: path.join(process.resourcesPath, ".env") })
  }
  console.log("Environment variables loaded for open-source version")
}

// Initialize application
async function initializeApp() {
  try {
    // Set custom cache directory to prevent permission issues
    const appDataPath = path.join(app.getPath('appData'), 'interview-coder-v1')
    const sessionPath = path.join(appDataPath, 'session')
    const tempPath = path.join(appDataPath, 'temp')
    const cachePath = path.join(appDataPath, 'cache')
    
    // Create directories if they don't exist
    for (const dir of [appDataPath, sessionPath, tempPath, cachePath]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
    
    app.setPath('userData', appDataPath)
    app.setPath('sessionData', sessionPath)      
    app.setPath('temp', tempPath)
    app.setPath('cache', cachePath)
      
    loadEnvVariables()
    
    // Ensure a configuration file exists
    if (!configHelper.hasApiKey()) {
      console.log("No API key found in configuration. User will need to set up.")
    }
    
    initializeHelpers()
    initializeIpcHandlers({
      getMainWindow,
      setWindowDimensions,
      getScreenshotQueue,
      getExtraScreenshotQueue,
      deleteScreenshot,
      getImagePreview,
      processingHelper: state.processingHelper,
      PROCESSING_EVENTS: state.PROCESSING_EVENTS,
      takeScreenshot,
      getView,
      toggleMainWindow,
      clearQueues,
      setView,
      moveWindowLeft: () =>
        moveWindowHorizontal((x) =>
          Math.max(-(state.windowSize?.width || 0) / 2, x - state.step)
        ),
      moveWindowRight: () =>
        moveWindowHorizontal((x) =>
          Math.min(
            state.screenWidth - (state.windowSize?.width || 0) / 2,
            x + state.step
          )
        ),
      moveWindowUp: () => moveWindowVertical((y) => y - state.step),
      moveWindowDown: () => moveWindowVertical((y) => y + state.step)
    })
    await createWindow()
    state.shortcutsHelper?.registerGlobalShortcuts()

    // Initialize auto-updater regardless of environment
    initAutoUpdater()
    console.log(
      "Auto-updater initialized in",
      isDev ? "development" : "production",
      "mode"
    )
  } catch (error) {
    console.error("Failed to initialize application:", error)
    app.quit()
  }
}

// Auth callback handling removed - no longer needed
app.on("open-url", (event, url) => {
  console.log("open-url event received:", url)
  event.preventDefault()
})

// Handle second instance (removed auth callback handling)
app.on("second-instance", (event, commandLine) => {
  console.log("second-instance event received:", commandLine)

  const url = commandLine.find(arg => arg.startsWith("interview-coder://"));
  if (url) {
    deeplinkUrl = url;
    handleAuthCallback(url);
  }
  
  // Focus or create the main window
  if (!state.mainWindow) {
    createWindow()
  } else {
    if (state.mainWindow.isMinimized()) state.mainWindow.restore()
    state.mainWindow.focus()
  }
})

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit()
      state.mainWindow = null
    }
  })
}

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// State getter/setter functions
function getMainWindow(): BrowserWindow | null {
  return state.mainWindow
}

function getView(): "queue" | "solutions" | "debug" {
  return state.view
}

function setView(view: "queue" | "solutions" | "debug"): void {
  // state.mainWindow.setIgnoreMouseEvents(true, { forward: true });
  state.view = view
  state.screenshotHelper?.setView(view)
}

function getScreenshotHelper(): ScreenshotHelper | null {
  return state.screenshotHelper
}

function getProblemInfo(): any {
  return state.problemInfo
}

function setProblemInfo(problemInfo: any): void {
  state.problemInfo = problemInfo
}

function getScreenshotQueue(): string[] {
  return state.screenshotHelper?.getScreenshotQueue() || []
}

function getExtraScreenshotQueue(): string[] {
  return state.screenshotHelper?.getExtraScreenshotQueue() || []
}

function clearQueues(): void {
  state.screenshotHelper?.clearQueues()
  state.problemInfo = null
  setView("queue")
}

async function takeScreenshot(): Promise<string> {
  if (!state.mainWindow) throw new Error("No main window available")
  return (
    state.screenshotHelper?.takeScreenshot(
      () => hideMainWindow(),
      () => showMainWindow()
    ) || ""
  )
}

async function getImagePreview(filepath: string): Promise<string> {
  return state.screenshotHelper?.getImagePreview(filepath) || ""
}

async function deleteScreenshot(
  path: string
): Promise<{ success: boolean; error?: string }> {
  return (
    state.screenshotHelper?.deleteScreenshot(path) || {
      success: false,
      error: "Screenshot helper not initialized"
    }
  )
}

function setHasDebugged(value: boolean): void {
  state.hasDebugged = value
}

function getHasDebugged(): boolean {
  return state.hasDebugged
}

// Export state and functions for other modules
export {
  state,
  createWindow,
  hideMainWindow,
  showMainWindow,
  toggleMainWindow,
  setWindowDimensions,
  moveWindowHorizontal,
  moveWindowVertical,
  getMainWindow,
  getView,
  setView,
  getScreenshotHelper,
  getProblemInfo,
  setProblemInfo,
  getScreenshotQueue,
  getExtraScreenshotQueue,
  clearQueues,
  takeScreenshot,
  getImagePreview,
  deleteScreenshot,
  setHasDebugged,
  getHasDebugged
}

app.whenReady().then(initializeApp)
