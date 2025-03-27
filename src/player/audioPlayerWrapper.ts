import { AudioPlayerStatus, createAudioPlayer, createAudioResource, VoiceConnection, type AudioPlayer } from "@discordjs/voice";
import { StreamQueue } from "./queue";
import type { Stream } from "../stream/stream.interface";


export class AudioPlayerWrapper {
    private player: AudioPlayer = createAudioPlayer();
    private queue: StreamQueue = new StreamQueue();
    private cur: Stream | null = null;

    public constructor(conn: VoiceConnection) {
        this.player.on(AudioPlayerStatus.Idle, () => {
            this.cur?.destroy();
            if (!this.queue.isEmpty()) {
                this.play();
                return;
            }
        });
        conn.subscribe(this.player);
    }

    public addToQueue(url: string, args: Array<string>): void {
        this.queue.add({ url, args });
    }

    public play(): void {
        this.cur = this.queue.next();
        if (!this.cur) return;
        const resource = createAudioResource(this.cur.getStdout());
        this.player.play(resource);
    }

    public skip(): void {
        this.player.stop();
    }

    public stop(): void {
        this.queue.free();
        this.player.stop();
    }

    public pause(): void {
        this.player.pause();
    }

    public resume(): void {
        this.player.unpause();
    }
}
