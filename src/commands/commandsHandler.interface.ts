import type { Context } from "../types";


export interface ICommandsHandler {
    handleCommand(ctx: Context): Promise<void> | void;
}
