import { inject, injectable } from "inversify";
import type { IPlayer } from "./player.interface";
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { TYPES, type Context } from "../types";
import type { ILogger } from "../logger/logger.interface";
import { spawn } from "child_process";
import type { VoiceBasedChannel } from "discord.js";


@injectable()
export class Player implements IPlayer {
    private players: Map<string, AudioPlayer>;

    public constructor(@inject(TYPES.Logger) private logger: ILogger) {
        this.players = new Map();
    }

    public async play(ctx: Context, args: string[]) {
        const voiceChannel = ctx.member?.voice.channel;

        if (!voiceChannel) return void ctx.reply("You must be in a voice");

        if (this.players.get(voiceChannel.guildId)) {
            
            return;
        }

        const conn = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
        });

        const ytdlpStream = spawn("yt-dlp", [
            "-o", '-', 
            "-x",
            "-q",
            "--audio-format", "opus", 
            "-f", "bestaudio",
            args[0], 
        ]);

        const ffmpegStream = spawn("ffmpeg", [
            "-i", "pipe:0",
            args.length > 1 ? "-af" : null,
            args.length > 1 ? args[1] : null,
            "-f", "opus",
            "pipe:1"
        ].filter(el => el != null));

        ytdlpStream.stdout.pipe(ffmpegStream.stdin);

        ytdlpStream.stderr.on('data', (data: Buffer) => {
            this.logger.error(String(data));
        });

        const player = createAudioPlayer();

        this.players.set(voiceChannel.guildId, player);

        const resource = createAudioResource(ffmpegStream.stdout);
        player.play(resource);

        player.on(AudioPlayerStatus.Idle, () => {
            ffmpegStream.stdin.destroy();
            ytdlpStream.stdout.destroy();
            ytdlpStream.kill();
            ffmpegStream.kill();
            conn.destroy();
            this.players.delete(voiceChannel.guildId);
        });

        conn.subscribe(player);
    }

    async stop(channel: VoiceBasedChannel): Promise<void> {
        const player = this.players.get(channel.guildId);

        if (!player) return;

        player.stop();
    }

    async pause(channel: VoiceBasedChannel): Promise<void> {
        const player = this.players.get(channel.guildId);

        if (!player) return;

        player.pause();
    }

    async resume(channel: VoiceBasedChannel): Promise<void> {
        const player = this.players.get(channel.guildId);

        if (!player) return;

        player.unpause();
    }
}
