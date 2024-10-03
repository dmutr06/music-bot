import { inject, injectable } from "inversify";
import type { ICommandsHandler } from "./commandsHandler.interface";
import { TYPES, type Context } from "../types";
import type { ILogger } from "../logger/logger.interface";
import type { IParser } from "../parser/parser.interface";
import { 
    AudioPlayerStatus, 
    createAudioPlayer, 
    createAudioResource, 
    getVoiceConnection, 
    joinVoiceChannel, 
    NoSubscriberBehavior 
} from "@discordjs/voice";

import { spawn } from "child_process";

const SHOW_YTDLP_INFO = true;

@injectable()
export class CommandsHandler implements ICommandsHandler {
    
    public constructor(
        @inject(TYPES.Logger) private logger: ILogger,
        @inject(TYPES.CommandParser) private cmdParser: IParser,
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
            default:
                return;
        }
    }

    async play(ctx: Context, args: string[]): Promise<void> {
        const voiceChannel = ctx.member?.voice.channel;

        if (!voiceChannel) return void ctx.reply("You must be in a voice");

        const conn = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
        });

        const ytdlpStream = spawn("yt-dlp", [
            "-o", '-', 
            "-x",
            !SHOW_YTDLP_INFO ? "-q" : "",
            "--audio-format", "opus", 
            "-f", "bestaudio",
            args[0]
        ], { shell: true });

        const ffmpegStream = spawn("ffmpeg", [
            "-i", "pipe:0",
            args.length > 1 ? "-af" : "",
            args.length > 1 ? args[1] : "",
            "-f", "opus",
            "pipe:1"
        ]);

        ytdlpStream.stdout.pipe(ffmpegStream.stdin);

        ytdlpStream.stderr.on('data', (data) => {
            this.logger.debug(String(data));
        });

        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Stop,
            },
        });

        const resource = createAudioResource(ffmpegStream.stdout);

        player.play(resource);

        player.on(AudioPlayerStatus.Idle, () => {
            ytdlpStream.kill();
            ffmpegStream.kill();
        });

        conn.subscribe(player);
    }

    async stop(ctx: Context): Promise<void> {
        const voiceChannel = ctx.member?.voice.channel;

        if (!voiceChannel) return void ctx.reply("You must be in a voice");

        const conn = getVoiceConnection(voiceChannel.guildId);

        conn?.destroy();
    }
}
