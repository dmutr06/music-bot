import fs, { createReadStream } from "fs";
import { access } from "fs/promises";
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { FfmpegStream } from "../stream/ffmpegStream";
import { YtdlpStream } from "../stream/ytdlpStream";
import { Stream } from "../stream/stream.interface";
import { ILogger } from "../logger/logger.interface";
import { SendableChannels, VoiceBasedChannel } from "discord.js";
import { TrackContext } from "../types";
import { readFileSync } from "fs";
import { Readable } from "stream";
import { CachedStream } from "../stream/cachedStream";
import { YoutubeService } from "../services/youtube";

const helloBuffer = readFileSync("hello.mp3");

export class Queue {
    private audioPlayer: AudioPlayer;
    public queue: TrackContext[] = [];
    private isPlaying: boolean = false;

    private curStream: Stream | null = null;
    private curVoiceChannel: VoiceBasedChannel | null = null;
    private curConn: VoiceConnection | null = null;

    constructor(private logger: ILogger) {
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

    public async enqueue(textChannel: SendableChannels, voiceChannel: VoiceBasedChannel, query: string, ffmpegArgs: string) {
        const track: TrackContext = { textChannel, voiceChannel, query, ffmpegArgs };

        this.logger.info(`Added ${query} to queue in voice ${voiceChannel.name}`);
        const fetchingMessage = await textChannel.send({
            embeds: [{
                title: "Fetching...",
            }],
        });

        try {
            const info = await YoutubeService.fetchTrackInfo(query);
            track.info = info;

            await fetchingMessage.edit({
                embeds: [{
                    title: `${info.title} added to queue`,
                }],
            });

            try {
                await access(`.cache/${info.id}`);
                track.resource = createAudioResource(createReadStream(`.cache/${info.id}`));
                track.stream = new CachedStream(`.cache/${info.id}`);
            } catch (e) {
                track.stream = new YtdlpStream(info.webpage_url);
                if (info.duration < 7200) {
                    // const writeStream = fs.createWriteStream(`.cache/${info.id}`);
                    // writeStream.on("unpipe", () => writeStream.close());
                    // track.stream?.stdout?.pipe(writeStream);
                }
            }

            track.stream = new FfmpegStream(ffmpegArgs, track.stream);
            track.resource = createAudioResource(track.stream.stdout!);
            this.queue.push(track);
        } catch (e) {
            await fetchingMessage.edit({
                embeds: [{
                    title: "Could not find a track",
                }],
            });
            this.logger.error("Failed to preload track:", e);
        }

        if (!this.isPlaying) this.next();
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
            await track.textChannel.send({
                embeds: [{
                    title: `Playing ${info.title}`,
                    description: `by ${info.uploader}`,
                    thumbnail: info.thumbnail ? { url: info.thumbnail } : undefined,
                }]
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
}
