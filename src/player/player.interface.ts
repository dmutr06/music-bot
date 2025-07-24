import type { VoiceBasedChannel } from "discord.js";
import type { Context } from "../types";


export interface IPlayer {
    play(ctx: Context, query: string, ffmpegArgs: string): Promise<void>;
    stop(channel: VoiceBasedChannel): Promise<void>;
    pause(channel: VoiceBasedChannel): Promise<void>;
    resume(channel: VoiceBasedChannel): Promise<void>;
    skip(channel: VoiceBasedChannel): Promise<void>;
    getQueue(ctx: Context): Promise<void>;
    ff(ctx: Context, time: number): Promise<void>;
}
