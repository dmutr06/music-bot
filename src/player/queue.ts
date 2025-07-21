import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { FfmpegStream } from "../stream/ffmpegStream";
import { YtdlpStream } from "../stream/ytdlpStream";
import { Stream } from "../stream/stream.interface";
import { ILogger } from "../logger/logger.interface";
import { VoiceBasedChannel } from "discord.js";

type Track = {
    voiceChannel: VoiceBasedChannel;
    query: string;
    ffmpegArgs: string;
    stream?: Stream;
    resource?: ReturnType<typeof createAudioResource>;
};

export class Queue {
    private audioPlayer: AudioPlayer;
    private queue: Track[] = [];
    private isPlaying: boolean = false;

    private curStream: Stream | null = null;
    private curVoiceChannel: VoiceBasedChannel | null = null;
    private curConn: VoiceConnection | null = null;

    private lastTrack: Track | null = null;

    constructor(private logger: ILogger) {
        this.audioPlayer = createAudioPlayer(); 

        this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
            this.curStream?.destroy();
            this.curStream = null;
            this.isPlaying = false;
            this.next();
        });

        this.audioPlayer.on("error", err => {
            this.logger.error("Audio Player Error:", err);
            this.next();
        });
    }

    public enqueue(voiceChannel: VoiceBasedChannel, query: string, ffmpegArgs: string) {
        const track: Track = { voiceChannel, query, ffmpegArgs };
        this.queue.push(track);
        this.logger.info(`Added ${query} to queue in voice ${voiceChannel.name}`);

        try {
            track.stream = new FfmpegStream(ffmpegArgs, new YtdlpStream(query));
            track.resource = createAudioResource(track.stream.stdout);
        } catch (e) {
            this.logger.error("Failed to preload track:", e);
        }

        if (!this.isPlaying) this.next();
    }

    private next() {
        if (this.queue.length == 0) {
            this.curConn?.destroy();
            this.curConn = null;
            this.curVoiceChannel = null;
            return;
        };

        const track = this.queue.shift()!;
        this.logger.info(`Playing ${track.query} (${track.ffmpegArgs})`);
        try {
            if (!this.curVoiceChannel || this.curVoiceChannel.id != track.voiceChannel.id) {
                this.curConn?.destroy(); 

                this.curVoiceChannel = track.voiceChannel;
                this.curConn = joinVoiceChannel({
                    channelId: track.voiceChannel.id,
                    guildId: track.voiceChannel.guildId,
                    adapterCreator: track.voiceChannel.guild.voiceAdapterCreator as any,
                }); 

                this.curConn.subscribe(this.audioPlayer);
            }

            if (!track.stream || !track.resource) {
                this.logger.warn("Track was not preloaded, loading now...");
                track.stream = new FfmpegStream(track.ffmpegArgs, new YtdlpStream(track.query));
                track.resource = createAudioResource(track.stream.stdout);
            }

            this.curStream = track.stream;
            this.lastTrack = track;
            this.isPlaying = true;
            this.audioPlayer.play(track.resource);
        } catch (e) {
            this.logger.error("Failed to play:", track.query);
            this.next();
        }
    }

    public skip() {
        this.audioPlayer.stop();
    }

    public clear() {
        this.queue = [];
        this.audioPlayer.stop();
    }

    public pause() {
        this.audioPlayer.pause();
    }

    public resume() {
        this.audioPlayer.unpause();
    }
}
