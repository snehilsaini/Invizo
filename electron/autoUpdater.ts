import { autoUpdater } from "electron-updater"
import { BrowserWindow, ipcMain, app } from "electron"
import log from "electron-log"
import fs from "fs";
import path from "path";

export function initAutoUpdater() {

  console.log("Main: initAutoUpdater called");


  // Log app path and permissions
console.log("App path:", app.getAppPath());
console.log("App is packaged:", app.isPackaged);
console.log("App userData path:", app.getPath('userData'));
console.log("App running as user:", process.env.USER || process.env.LOGNAME);


  console.log("Initializing auto-updater...")

  // Listen for all autoUpdater events
// autoUpdater.on("before-quit-for-update", () => {
//   console.log("autoUpdater: before-quit-for-update event fired");
// });


autoUpdater.on("error", (err) => {
  console.error("autoUpdater: error event:", err);
});

// Listen for app lifecycle events
app.on("before-quit", (event) => {
  console.log("app: before-quit event");
});
app.on("will-quit", (event) => {
  console.log("app: will-quit event");
});
app.on("quit", (event, exitCode) => {
  console.log("app: quit event, exitCode:", exitCode);
});

// app.on("before-quit-for-update", () => {
//   console.log("app: before-quit-for-update event fired");
// });

  // Skip update checks in development
  if (!app.isPackaged) {
    console.log("Skipping auto-updater in development mode")
    return
  }

  // if (!process.env.GH_TOKEN) {
  //   console.error("GH_TOKEN environment variable is not set")
  //   return
  // }

  // Configure auto updater
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = true
  autoUpdater.allowPrerelease = true

  // Enable more verbose logging
  autoUpdater.logger = log
  log.transports.file.level = "debug"
  console.log(
    "Auto-updater logger configured with level:",
    log.transports.file.level
  )

  // Log all update events
  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for updates...")
  })

  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info)
    // Notify renderer process about available update
    BrowserWindow.getAllWindows().forEach((window) => {
      console.log("Sending update-available to window")
      window.webContents.send("update-available", info)
    })
  })

  autoUpdater.on("update-not-available", (info) => {
    console.log("Update not available:", info)
  })

  autoUpdater.on("download-progress", (progressObj) => {
    console.log("Download progress:", progressObj)
  })

  autoUpdater.on("update-downloaded", (info) => {
    console.log("Update downloaded:", info)
    // Notify renderer process that update is ready to install
    BrowserWindow.getAllWindows().forEach((window) => {
      console.log("Sending update-downloaded to window")
      window.webContents.send("update-downloaded", info)
    })
  })

  autoUpdater.on("error", (err) => {
    console.error("Auto updater error:", err)
  })

  // Check for updates immediately
  console.log("Checking for updates...")
  autoUpdater
    .checkForUpdates()
    .then((result) => {
      console.log("Update check result:", result)
    })
    .catch((err) => {
      console.error("Error checking for updates:", err)
    })

  // Set up update checking interval (every 1 hour)
  setInterval(() => {
    console.log("Checking for updates (interval)...")
    autoUpdater
      .checkForUpdates()
      .then((result) => {
        console.log("Update check result (interval):", result)
      })
      .catch((err) => {
        console.error("Error checking for updates (interval):", err)
      })
  }, 60 * 60 * 1000)

  // Handle IPC messages from renderer
  ipcMain.handle("start-update", async () => {
    console.log("Start update requested")
    try {
      await autoUpdater.downloadUpdate()
      console.log("Update download completed")
      return { success: true }
    } catch (error) {
      console.error("Failed to start update:", error)
      return { success: false, error: error.message }
    }
  })

  // ipcMain.handle("install-update", () => {
  //   console.log("Install update requested")
  //   autoUpdater.quitAndInstall();
  // })

  ipcMain.handle("install-update", () => {
    console.log("Main: install-update IPC handler called");
    console.log("Install update requested");
    try {
      console.log("Calling autoUpdater.quitAndInstall()");
      autoUpdater.quitAndInstall();
      console.log("Called autoUpdater.quitAndInstall()");
    } catch (err) {
      console.error("Error calling quitAndInstall:", err);
    }
    // As a fallback, try a manual restart (for debugging)
    setTimeout(() => {
      console.log("Fallback: trying app.relaunch() and app.quit()");
      app.relaunch();
      app.quit();
    }, 5000); // Wait 5 seconds to see if quitAndInstall works first
  });
}
