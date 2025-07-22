import type { ILogger } from "./logger.interface";


export class Logger implements ILogger {
    public debug(...args: any[]): void {
        console.log("[DEBUG] ", ...args); 
    }

    public info(...args: any[]): void {
        console.log("[INFO] ", ...args); 
    }

    public warn(...args: any[]): void {
        
        console.log("[WARN] ", ...args); 
    }

    public error(...args: any[]): void {
        console.log("[ERROR] ", ...args); 
    }
}

