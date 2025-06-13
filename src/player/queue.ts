import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, VoiceConnection } from "@discordjs/voice";
import { FfmpegStream } from "../stream/ffmpegStream";
import { YtdlpStream } from "../stream/ytdlpStream";
import { Stream } from "../stream/stream.interface";
import { ILogger } from "../logger/logger.interface";

export class Queue {
    private audioPlayer: AudioPlayer;
    private queue: { url: string, args: string[] }[] = [];
    private isPlaying: boolean = false;

    private curStream: Stream | null = null;

    constructor(private logger: ILogger, private conn: VoiceConnection) {
        this.audioPlayer = createAudioPlayer(); 

        this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
            this.curStream?.destroy();
            this.isPlaying = false;
            this.next();
        });

        this.audioPlayer.on("error", err => {
            this.logger.error("Audio Player Error:", err);
            this.next();
        });

        this.conn.subscribe(this.audioPlayer);
    }

    public enqueue(url: string, args: string[]) {
        this.queue.push({ url, args });
        this.logger.info(`Added ${url} to queue`);
        if (!this.isPlaying) this.next();
    }

    private next() {
        if (this.queue.length == 0) return;

        const track = this.queue.shift()!;
        this.logger.info(`Playing ${track.url} (${track.args})`);
        try {
            this.curStream = new FfmpegStream(track.args, new YtdlpStream(track.url));
            const resource = createAudioResource(this.curStream.stdout);

            this.audioPlayer.play(resource);
            this.isPlaying = true;
        } catch (e) {
            this.logger.error("Failed to play:", track.url);
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
