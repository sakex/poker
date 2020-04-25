import React, {Component} from "react";
import SocketIOClient from "socket.io-client";
import {UserList} from "@components/userList";
import Styled from "styled-components";

const Container = Styled.div`
    z-index: 5;
    width: 1100px;
    height: 725.6px;
    position: absolute;
    top: 0;
    left: calc(50% - 550px);
`;

interface VideoProps {
    socket: SocketIOClient.Socket,
    conId: string,
    members: string[],
    renderProps: (callRemote: (id: string) => Promise<void>, setVideoPos: (id: string, x: number, y: number) => void) => void
}

interface CallParams {
    id: string,
    senderId: string,
    data: string
}

interface IDPos {
    [id: string]: [number, number]
}

export class VideoChat extends Component<VideoProps, {}> {
    private readonly socket = SocketIOClient.Socket;
    private readonly conId: string;
    private streaming;
    private idsPos: IDPos = {};

    constructor(props: VideoProps) {
        super(props);

        this.socket = props.socket;
        this.conId = props.conId;
    }

    setVideoPos = (id: string, x: number, y: number) => {
        try {
            this.idsPos[id] = [x, y];
            if (this.streaming.get_ids().has(id)) {
                this.streaming.set_video_pos(id, x, y);
            }
        } catch (err){
            console.log(this.idsPos);
            console.log(this.streaming.get_ids());
            console.error("setVideoPos failed: ")
            console.error(err.stack);
        }
    };

    feedSocket = () => {
        this.socket.on("candidate", ({senderId, candidate}) => {
            try {
                this.streaming.add_ice_candidate(senderId, candidate);
            } catch (err) {
                console.error(err);
            }
        });

        this.socket.on("call", async ({senderId, data}: CallParams) => {
            try {
                this.streaming.create_connection(senderId);
                const offer = JSON.parse(data);
                this.streaming.set_on_ice_candidate(senderId, (candidate) => {
                    this.socket.emit("candidate", {candidate, senderId: this.conId, id: senderId});
                });
                const answer = await this.streaming.accept_offer(senderId, offer).get_offer();
                this.socket.emit("answer", ({id: senderId, senderId: this.conId, data: JSON.stringify(answer)}));
                const ids = this.streaming.get_ids();
                if (ids.length > 1) {
                    this.socket.emit("callMembers", ({id: senderId, members: [...this.streaming.get_ids()]}));
                }
                if (senderId in this.idsPos)
                    this.streaming.set_video_pos(senderId, ...this.idsPos[senderId]);
            } catch (err) {
                console.error("already connected");
            }
        });

        this.socket.on("answer", async ({senderId, data}: CallParams) => {
            const offer = JSON.parse(data);
            await this.streaming.accept_answer(senderId, offer).get_offer();
        });
    };

    public callRemote = async (user: string) => {
        try {
            await this.streaming.create_connection(user);
            this.streaming.set_on_ice_candidate(user, (candidate) => {
                this.socket.emit("candidate", {candidate, senderId: this.conId, id: user});
            });
            const offer = await this.streaming.create_offer(user).get_offer();

            this.socket.emit("call", ({id: user, senderId: this.conId, data: JSON.stringify(offer)}));
            if (user in this.idsPos)
                this.streaming.set_video_pos(user, ...this.idsPos[user]);
        } catch (err) {
            console.error(err.stack);
        }
    };

    async componentDidMount() {
        const {Streaming, init_panic_hook} = await import("@video-stream");
        init_panic_hook();
        this.streaming = new Streaming(document.querySelector("#firstVideo"));
        this.streaming.not_managed();
        this.feedSocket();
        this.props.renderProps(this.callRemote, this.setVideoPos);
        try {
            await this.streaming.load_video();
            this.streaming.set_video_pos("self", 450, 500);
        } catch (err) {
            console.log(err);
            alert("Couldn't load video");
        }
    }

    render() {
        return <>
            <Container id="firstVideo"/>
            <UserList callRemote={this.callRemote} {...this.props}/>
        </>;
    }
}