import { inject, injectable } from "inversify";
import type { IPlayer } from "./player.interface";
import { joinVoiceChannel } from "@discordjs/voice";
import { TYPES, type Context } from "../types";
import type { ILogger } from "../logger/logger.interface";
import type { VoiceBasedChannel } from "discord.js";
import { Queue } from "./queue";

@injectable()
export class Player implements IPlayer {
    private queues: Map<string, Queue>;

    public constructor(@inject(TYPES.Logger) private logger: ILogger) {
        this.queues = new Map();
    }

    public async play(ctx: Context, args: string[]) {
        const voiceChannel = ctx.member?.voice.channel;

        if (!voiceChannel) return void ctx.reply("You must be in a voice");

        let queue = this.queues.get(voiceChannel.guildId);

        if (!queue) {
            const conn = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guildId,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
            }); 

            queue = new Queue(this.logger, conn);

            this.queues.set(voiceChannel.guildId, queue);
        }

        queue.enqueue(args[0], args.slice(1));
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
}
