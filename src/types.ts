import type { Message, OmitPartialGroupDMChannel } from "discord.js"

export type Context = OmitPartialGroupDMChannel<Message<boolean>>;
