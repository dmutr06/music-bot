import { inject, injectable } from "inversify";
import type { IPlayer } from "./player.interface";
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { TYPES, type Context } from "../types";
import type { ILogger } from "../logger/logger.interface";
import type { VoiceBasedChannel } from "discord.js";
import { FfmpegStream } from "../stream/ffmpegStream";
import { YtdlpStream } from "../stream/ytdlpStream";


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

        const stream = new FfmpegStream(args.slice(1), new YtdlpStream(args[0]));

        const player = createAudioPlayer();

        this.players.set(voiceChannel.guildId, player);

        const resource = createAudioResource(stream.stdout);
        player.play(resource);

        player.on(AudioPlayerStatus.Idle, () => {
            try {
                conn.destroy();
                stream.destroy();
            } catch (e) {
                this.logger.error(e);
            }
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
