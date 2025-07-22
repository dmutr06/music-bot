import type { ICommandsHandler } from "./commandsHandler.interface";
import { type Context } from "../types";
import type { IParser } from "../parser/parser.interface";

import type { IPlayer } from "../player/player.interface";

export class CommandsHandler implements ICommandsHandler {
    
    public constructor(
        private cmdParser: IParser,
        private player: IPlayer,
    ) {}

    async handleCommand(ctx: Context): Promise<void> {
        const res = this.cmdParser.parse(ctx.content);

        if (!res) return;

        const { cmd, rest } = res;

        switch (cmd) {
            case "play":
                if (!rest) return void ctx.reply("Provide url");
                return this.play(ctx, rest);
            case "stop":
                return this.stop(ctx);
            case "pause":
                return this.pause(ctx);
            case "resume":
                return this.resume(ctx);
            case "skip":
                return this.skip(ctx);
            case "queue":
                return this.queue(ctx);
            default:
                return;
        }
    }

    async play(ctx: Context, rest: string): Promise<void> {
        const [query, ffmpegArgs] = rest.split("--", 2);
        this.player.play(ctx, query.trimEnd(), ffmpegArgs?.trim());
    }

    async stop(ctx: Context): Promise<void> {
        const voiceChannel = ctx.member?.voice.channel;
        if (!voiceChannel) return;
        this.player.stop(voiceChannel);
    }

    async pause(ctx: Context): Promise<void> {
        const voiceChannel = ctx.member?.voice.channel;
        if (!voiceChannel) return;
        this.player.pause(voiceChannel);
    }

    async resume(ctx: Context): Promise<void> {
        const voiceChannel = ctx.member?.voice.channel;
        if (!voiceChannel) return;
        this.player.resume(voiceChannel);
    }

    async skip(ctx: Context): Promise<void> {
        const voiceChannel = ctx.member?.voice.channel;
        if (!voiceChannel) return;
        this.player.skip(voiceChannel);
    }

    async queue(ctx: Context): Promise<void> {
        this.player.getQueue(ctx);
    }

}
