import type { Message, OmitPartialGroupDMChannel, SendableChannels, VoiceBasedChannel } from "discord.js"
import { createAudioResource } from "@discordjs/voice";
import { Stream } from "./stream/stream.interface";

export type Context = OmitPartialGroupDMChannel<Message<boolean>>;

export type TrackInfo = {
    id: string;
    title: string;
    duration: number;
    uploader: string;
    webpage_url: string;
    thumbnail?: string;
};

export type TrackContext = {
    textChannel: SendableChannels,
    voiceChannel: VoiceBasedChannel;
    query: string;
    ffmpegArgs: string;
    stream?: Stream;
    resource?: ReturnType<typeof createAudioResource>;
    info: TrackInfo;
};

export type PlaylistInfo = {
    title: string,
    entries: TrackInfo[],
};
