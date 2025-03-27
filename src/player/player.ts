import {  joinVoiceChannel, VoiceConnectionStatus  } from "@discordjs/voice";
import type { Context } from "../context.type";
import type { VoiceBasedChannel } from "discord.js";
import { AudioPlayerWrapper } from "./audioPlayerWrapper";

export class Player {
    private players: Map<string, AudioPlayerWrapper> = new Map();

    public async play(ctx: Context, args: Array<string>) {
        const [url, ...flags] = args;
        if (!url)
            return void ctx.reply("Provide url");
        const voiceChan = ctx.member?.voice.channel;
        if (!voiceChan)
            return void ctx.reply("You must be in avoice");

        let player = this.players.get(voiceChan.guildId); 
        if (player) {
            player.addToQueue(url, flags);
            return;
        }

        const conn = joinVoiceChannel({
            channelId: voiceChan.id,
            guildId: voiceChan.guildId,
            adapterCreator: voiceChan.guild.voiceAdapterCreator,
        });

        conn.on("stateChange", (_oldState, newState) => {
            if (
                newState.status == VoiceConnectionStatus.Disconnected
                || newState.status == VoiceConnectionStatus.Destroyed
            ) {
                const player = this.players.get(voiceChan.guildId);
                player?.stop();
                this.players.delete(voiceChan.guildId);
            }
        });

        player = new AudioPlayerWrapper(conn);
        player.addToQueue(url, flags);
        player.play();
        this.players.set(voiceChan.guildId, player);
    }

    public async stop(chan: VoiceBasedChannel): Promise<void> {
        this.players.get(chan.guildId)?.stop();
        this.players.delete(chan.guildId);
    }

    public async pause(chan: VoiceBasedChannel): Promise<void> {
        this.players.get(chan.guildId)?.pause();
    }

    public async resume(chan: VoiceBasedChannel): Promise<void> {
        this.players.get(chan.guildId)?.resume();
    }
    
    public async skip(chan: VoiceBasedChannel): Promise<void> {
        this.players.get(chan.guildId)?.skip();
    }
}
