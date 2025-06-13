import { inject, injectable } from "inversify";
import type { ICommandsHandler } from "./commandsHandler.interface";
import { TYPES, type Context } from "../types";
import type { ILogger } from "../logger/logger.interface";
import type { IParser } from "../parser/parser.interface";

import type { IPlayer } from "../player/player.interface";

@injectable()
export class CommandsHandler implements ICommandsHandler {
    
    public constructor(
        @inject(TYPES.Logger) private logger: ILogger,
        @inject(TYPES.CommandParser) private cmdParser: IParser,
        @inject(TYPES.Player) private player: IPlayer,
    ) {}

    async handleCommand(ctx: Context): Promise<void> {
        const res = this.cmdParser.parse(ctx.content);

        if (!res) return;

        const { cmd, args } = res;

        switch (cmd) {
            case "play":
                if (args.length < 1) return void ctx.reply("Provide url");
                return this.play(ctx, args);
            case "stop":
                return this.stop(ctx);
            case "pause":
                return this.pause(ctx);
            case "resume":
                return this.resume(ctx);
            case "skip":
                return this.skip(ctx);
            default:
                return;
        }
    }

    async play(ctx: Context, args: string[]): Promise<void> {
        this.player.play(ctx, args);
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
}
