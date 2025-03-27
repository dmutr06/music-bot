import { FfmpegStream } from "../stream/ffmpegStream";
import type { Stream } from "../stream/stream.interface";
import { YtdlpStream } from "../stream/ytdlpStream";

export class StreamQueue {
    private queue: Array<{ url: string, args: Array<string>, }> = [];

    public next(): Stream | null {
        const cur = this.queue.pop();
        if (!cur) return null;

        return new FfmpegStream(new YtdlpStream(cur.url), cur.args);
    }

    public add(query: { url: string, args: Array<string> }) {
        return this.queue.push(query);
    }

    public isEmpty(): boolean {
        return this.queue.length == 0;
    }

    public free() {
        this.queue = [];
    }
}
