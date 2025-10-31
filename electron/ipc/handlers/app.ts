import { ipcMain, app } from "electron";

export function setupAppIpcEndpoints() {
    // get current app version
    ipcMain.handle("app:get-version", () => {
        return app.getVersion()
    })

    // get current app's executable path
    ipcMain.handle("app:get-exe-path", () => {
        return app.getAppPath()
    })
}