import type { IPlayer } from "./player.interface";
import { type Context } from "../types";
import type { ILogger } from "../logger/logger.interface";
import type { VoiceBasedChannel } from "discord.js";
import { Queue } from "./queue";

export class Player implements IPlayer {
    private queues: Map<string, Queue>;

    public constructor(private logger: ILogger) {
        this.queues = new Map();
    }

    public async play(ctx: Context, query: string, ffmpegArgs: string) {
        const voiceChannel = ctx.member?.voice.channel;

        if (!voiceChannel) return void ctx.reply("You must be in a voice");

        let queue = this.queues.get(voiceChannel.guildId);

        if (!queue) {
            queue = new Queue(this.logger, ctx);

            this.queues.set(voiceChannel.guildId, queue);
        }

        queue.enqueue(voiceChannel, query, ffmpegArgs);
        // queue.enqueue(args[0], args.slice(1));
    }

    async stop(channel: VoiceBasedChannel): Promise<void> {
        this.queues.get(channel.guildId)?.clear();
    }

    async pause(channel: VoiceBasedChannel): Promise<void> {
        this.queues.get(channel.guildId)?.pause();
    }

    async resume(channel: VoiceBasedChannel): Promise<void> {
        this.queues.get(channel.guildId)?.resume();
    }

    async skip(channel: VoiceBasedChannel): Promise<void> {
        this.queues.get(channel.guildId)?.skip();
    }

    async getQueue(ctx: Context): Promise<void> {
        const guildId = ctx.guildId;
        if (!guildId) return;

        const queue = this.queues.get(guildId);

        if (!queue || queue.queue.length == 0) {
            ctx.reply("Queue is empty");
            return;
        }

        const tracks = queue.queue;

        let msg = "";

        for (let i = 0; i < tracks.length; ++i) {
            const info = tracks[i].info;
            if (info) {
                msg += `${i + 1}. «${info.title}» by ${info.uploader}\n`;
            } else {
                msg += `${i + 1}. Info about this track has not loaded yet\n`;
            }
        }

        ctx.reply(msg);
    }
}
