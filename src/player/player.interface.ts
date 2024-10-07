import type { VoiceBasedChannel } from "discord.js";
import type { Context } from "../types";


export interface IPlayer {
    play(ctx: Context, args: string[]): Promise<void>;
    stop(channel: VoiceBasedChannel): Promise<void>;
    pause(channel: VoiceBasedChannel): Promise<void>;
    resume(channel: VoiceBasedChannel): Promise<void>;
}
