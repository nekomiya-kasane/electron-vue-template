import { setupAppIpcEndpoints as setupIpcEndpoints_App } from "./handlers/app";
import { setupSocketIpcEndpoints } from "./handlers/socket";

export function setupIpcEndpoints() {
    setupIpcEndpoints_App()
    setupSocketIpcEndpoints()
}