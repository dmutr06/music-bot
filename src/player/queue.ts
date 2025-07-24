import fs from "fs";
import { access } from "fs/promises";
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, StreamType, VoiceConnection } from "@discordjs/voice";
import { FfmpegStream } from "../stream/ffmpegStream";
import { YtdlpStream } from "../stream/ytdlpStream";
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

    private curVoiceChannel: VoiceBasedChannel | null = null;
    private curConn: VoiceConnection | null = null;

    constructor(private logger: ILogger) {
        this.audioPlayer = createAudioPlayer(); 

        this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
            if (!this.isPlaying) return;
            this.isPlaying = false;
            if (this.queue.length != 0) {
                const track = this.queue.shift();
                track?.stream?.destroy();
            }
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
        this.logger.info(`Fetching ${query} for ${voiceChannel.name}`);
        const fetchingMessage = await textChannel.send({
            embeds: [{
                title: "Fetching...",
            }],
        });

        try {
            const info = await YoutubeService.fetchInfo(query);

            switch (info.type) {
                case "video": {
                    this.queue.push({
                        voiceChannel,
                        textChannel,
                        query,
                        ffmpegArgs,
                        info: info.trackInfo,
                    });

                    await fetchingMessage.edit({
                        embeds: [{
                            title: `${info.trackInfo.title} added to queue`,
                            color: 0x10FFa0,
                        }],
                    });

                    break;
                };
                case "playlist": {
                    for (const track of info.playlistInfo.entries) {
                        this.queue.push({
                            voiceChannel,
                            textChannel,
                            query,
                            ffmpegArgs,
                            info: track,
                        });
                    }
                    await fetchingMessage.edit({
                        embeds: [{
                            title: `${info.playlistInfo.title} added to queue`,
                            color: 0x10FFa0,
                        }],
                    });
                };
            }
        } catch (e) {
            await fetchingMessage.edit({
                embeds: [{
                    title: "Could not find a track",
                    color: 0xFF1010,
                }],
            });
            this.logger.error("Failed to preload track:", e);
        }

        if (!this.isPlaying) return this.next();
        if (this.queue.length > 1) this.prepareTrack(this.queue[1]);
    }

    private async prepareTrack(track: TrackContext) {
        if (track.stream) return;

        const info = track.info!;
        try {
            await access(`.cache/${info.id}`);
            track.stream = new CachedStream(`.cache/${info.id}`);
        } catch {
            track.stream = new YtdlpStream(info.webpage_url, !info.duration);
            if (info.duration && info.duration < 7200) {
                const writeStream = fs.createWriteStream(`.cache/${info.id}`);
                track.stream?.stdout?.pipe(writeStream);
            }
        }

        try {
            track.stream = new FfmpegStream(track.ffmpegArgs, track.stream!);
            track.resource = createAudioResource(track.stream.stdout!);
        } catch (e) {
            this.logger.error("Error creating ffmpeg stream:", e);
            track.stream?.destroy();
            track.stream = undefined;
            track.resource = undefined;
        }
	
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

            if (!track.stream) {
                await this.prepareTrack(track);
            }

            if (!track.stream) throw new Error("Failed to load a track");

            this.isPlaying = true;
            this.audioPlayer.play(track.resource!);

            const info = this.queue[0].info!;
            await track.textChannel.send({
                embeds: [{
                    title: `Playing ${info.title}`,
                    description: `by ${info.uploader}`,
                    image: info.thumbnail ? { url: info.thumbnail } : undefined,
                    color: 0x10a0FF,
                }]
            });

            if (this.queue.length > 1) this.prepareTrack(this.queue[1]);
        } catch (e) {
            this.isPlaying = false;
            this.logger.error("Failed to play:", track.info.title, e);
            this.next();
        }
    }

    public skip() {
        this.audioPlayer.stop();
    }

    public clear() {
        this.queue = this.queue.slice(0, 1);
        this.audioPlayer.stop();
    }

    public pause() {
        this.audioPlayer.pause();
    }

    public resume() {
        this.audioPlayer.unpause();
    }

    public ff(time: number) {
        if (!this.isPlaying) return;
        // this.isPlaying = false;
        //
        // const track = this.queue[0];
        //
        // if (!track || !track.stream) return;
        //
        // track.stream.stdout?.unpipe();
        // track.stream = new FfmpegStream(`atrim=start=${time}`, track.stream!);
        // track.resource?.playStream()
        // track.resource = createAudioResource(track.stream?.stdout!);
        // this.isPlaying = true;
        // this.audioPlayer.play(track.resource);
    }
}
