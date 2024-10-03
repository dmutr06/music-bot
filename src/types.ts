import type { Message, OmitPartialGroupDMChannel } from "discord.js"


export const TYPES = {
    App: Symbol.for("App"),
    Logger: Symbol.for("Logger"),
    CommandParser: Symbol.for("CommandParser"),
    CommandsHandler: Symbol.for("CommandsHandler"),
}

export type Context = OmitPartialGroupDMChannel<Message<boolean>>;
