import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { FfmpegStream } from "../stream/ffmpegStream";
import { YtdlpStream } from "../stream/ytdlpStream";
import { Stream } from "../stream/stream.interface";
import { ILogger } from "../logger/logger.interface";
import { VoiceBasedChannel } from "discord.js";

type QueuedTrack = {
    voiceChannel: VoiceBasedChannel;
    url: string;
    args: string[];
    stream?: Stream;
    resource?: ReturnType<typeof createAudioResource>;
};

export class Queue {
    private audioPlayer: AudioPlayer;
    private queue: QueuedTrack[] = [];
    private isPlaying: boolean = false;

    private curStream: Stream | null = null;
    private curVoiceChannel: VoiceBasedChannel | null = null;
    private curConn: VoiceConnection | null = null;

    private lastTrack: QueuedTrack | null = null;

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

    public enqueue(voiceChannel: VoiceBasedChannel, url: string, args: string[]) {
        const track: QueuedTrack = { voiceChannel, url, args };
        this.queue.push(track);
        this.logger.info(`Added ${url} to queue in voice ${voiceChannel.name}`);

        try {
            track.stream = new FfmpegStream(args, new YtdlpStream(url));
            track.resource = createAudioResource(track.stream.stdout);
        } catch (e) {
            this.logger.error("Failed to preload track:", e);
        }

        if (!this.isPlaying) this.next();
    }

    private next() {
        if (this.queue.length == 0) {
            if (this.lastTrack) {
                this.enqueue(this.lastTrack?.voiceChannel, this.lastTrack?.url, this.lastTrack?.args);
            }
            return;
        };

        const track = this.queue.shift()!;
        this.logger.info(`Playing ${track.url} (${track.args})`);
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
                track.stream = new FfmpegStream(track.args, new YtdlpStream(track.url));
                track.resource = createAudioResource(track.stream.stdout);
            }

            this.curStream = track.stream;
            this.lastTrack = track;
            this.audioPlayer.play(track.resource);
            this.isPlaying = true;
        } catch (e) {
            this.logger.error("Failed to play:", track.url);
            this.next();
        }
    }

    public skip() {
        this.lastTrack = null;
        this.audioPlayer.stop();
    }

    public clear() {
        this.queue = [];
        this.lastTrack = null;
        this.audioPlayer.stop();
    }

    public pause() {
        this.audioPlayer.pause();
    }

    public resume() {
        this.audioPlayer.unpause();
    }
}
