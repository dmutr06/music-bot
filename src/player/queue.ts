import fs, { createReadStream } from "fs";
import { access } from "fs/promises";
import { spawn } from "child_process";
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { FfmpegStream } from "../stream/ffmpegStream";
import { YtdlpStream } from "../stream/ytdlpStream";
import { Stream } from "../stream/stream.interface";
import { ILogger } from "../logger/logger.interface";
import { VoiceBasedChannel } from "discord.js";
import { Context } from "../types";
import { readFileSync } from "fs";
import { Readable } from "stream";
import { CachedStream } from "../stream/cachedStream";

const helloBuffer = readFileSync("hello.mp3");


export interface TrackInfo {
    id: string;
    title: string;
    duration: number;
    uploader: string;
    webpage_url: string;
    thumbnail?: string;
};

type Track = {
    voiceChannel: VoiceBasedChannel;
    query: string;
    ffmpegArgs: string;
    stream?: Stream;
    resource?: ReturnType<typeof createAudioResource>;
    info?: TrackInfo;
};

export class Queue {
    private audioPlayer: AudioPlayer;
    public queue: Track[] = [];
    private isPlaying: boolean = false;

    private curStream: Stream | null = null;
    private curVoiceChannel: VoiceBasedChannel | null = null;
    private curConn: VoiceConnection | null = null;

    constructor(private logger: ILogger, private ctx: Context) {
        this.audioPlayer = createAudioPlayer(); 

        this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
            if (!this.isPlaying) return;
            this.curStream?.destroy();
            this.curStream = null;
            this.isPlaying = false;
            this.queue.shift();
            this.next();
        });

        this.audioPlayer.on("error", err => {
            this.logger.error("Audio Player Error:", err);
            this.next();
        });
    }

    private async joinVoiceChannel(voiceChannel: VoiceBasedChannel): Promise<void> {
        return new Promise((resolve) => {
            if (!this.curVoiceChannel || this.curVoiceChannel.id != voiceChannel.id) {
                this.curConn?.destroy(); 

                this.curVoiceChannel = voiceChannel;
                this.curConn = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guildId,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
                }); 

                const resource = createAudioResource(Readable.from(helloBuffer));

                this.audioPlayer.play(resource);

                this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
                    if (resource.ended) resolve();
                });

                this.curConn.subscribe(this.audioPlayer);
            } else {
                resolve();
            }
        });
    }

    public async enqueue(voiceChannel: VoiceBasedChannel, query: string, ffmpegArgs: string) {
        const track: Track = { voiceChannel, query, ffmpegArgs };
        this.logger.info(`Added ${query} to queue in voice ${voiceChannel.name}`);

        let cachingPromise = new Promise<void>((res) => res());

        try {
            const info = await this.fetchTrackInfo(query);
            track.info = info;

            try {
                await access(`.cache/${info.id}`);
                track.resource = createAudioResource(createReadStream(`.cache/${info.id}`));
                track.stream = new CachedStream(`.cache/${info.id}`);
            } catch (e) {
                track.stream = new YtdlpStream(info.webpage_url);
                if (info.duration < 7200) {
                    cachingPromise = new Promise<void>((res, rej) => {
                        const writeStream = fs.createWriteStream(`.cache/${info.id}`);
                        writeStream.on("unpipe", () => writeStream.close());
                        track.stream?.stdout?.pipe(writeStream);
                        
                        writeStream.on("finish", res);
                        writeStream.on("error", rej);
                    });
                }
            }

            track.stream = new FfmpegStream(ffmpegArgs, track.stream);
            track.resource = createAudioResource(track.stream.stdout!);
            this.queue.push(track);
        } catch (e) {
            this.ctx.reply("Could not find a track");
            this.logger.error("Failed to preload track:", e);
        }

        if (!this.isPlaying) this.next();

        await cachingPromise;
    }

    private async next() {
        if (this.queue.length == 0) {
            this.curConn?.destroy();
            this.curConn = null;
            this.curVoiceChannel = null;
            return;
        };

        const track = this.queue[0];
        this.logger.info(`Playing ${track.query} (${track.ffmpegArgs})`);
        try {

            await this.joinVoiceChannel(track.voiceChannel);

            if (!track.stream || !track.resource) {
                this.queue.shift();
                return;
            }

            this.curStream = track.stream;
            this.isPlaying = true;
            this.audioPlayer.play(track.resource);

            const info = this.queue[0].info!;
            this.ctx.channel.send({
                files: [info.thumbnail || ""],
                content: `Playing\n«${info.title}» by ${info.uploader}`,
            });
        } catch (e) {
            this.isPlaying = false;
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

    private async fetchTrackInfo(url: string): Promise<TrackInfo> {
        return new Promise((resolve, reject) => {
            const ytdlp = spawn(
                "yt-dlp",
                [
                    "--skip-download", 
                    "--print", 
                    '{"id": "%(id)s", "title": "%(title)s", "duration": %(duration)s, "uploader": "%(uploader)s", "webpage_url": "%(webpage_url)s", "thumbnail": "%(thumbnail)s"}',
                    "-f", "bestaudio",
                    "--default-search", "ytsearch",
                    url,
                ],
            );

            let json = "";

            ytdlp.stdout.on("data", (chunk) => {
                json += String(chunk);
            });

            ytdlp.on("close", code => {
                if (code != 0) return reject(new Error("yt-dlp could not fetch info"));

                try {
                    const data = JSON.parse(json);

                    const info: TrackInfo = {
                        id: data.id,
                        title: data.title,
                        duration: data.duration,
                        uploader: data.uploader,
                        webpage_url: data.webpage_url,
                        thumbnail: data.thumbnail,
                    }

                    resolve(info);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
}
