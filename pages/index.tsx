import React, {Component} from 'react';
import Poker from "@components/poker";
import SocketIOClient from "socket.io-client";
import {NameInput} from "@components/nameInput";
import {Lobby, TableData} from "@components/lobby";
import {VideoChat} from "@components/videoChat";

interface State {
    conId: string,
    members: string[],
    inputName: string,
    joined: number,
    tables: TableData[]
}

export default class Index extends Component<{}, State> {
    public state: State = {conId: null, members: [], inputName: "", joined: -1, tables: []};
    private readonly socket: SocketIOClient.Socket;

    constructor(props) {
        super(props);
        this.socket = SocketIOClient();
    }

    sendName = async () => {
        this.loadSocket();
        this.socket.emit("enterId", this.state.inputName);
    };

    loadSocket = () => {
        this.socket.on("connectionId", async (conId: string) => {
            await this.setState({conId: conId.toString()});
        });

        this.socket.on("err", (error: string) => {
            console.error(`An error occurred: ${error}`);
        });

        this.socket.on("joined", (joined: number) => {
            this.setState({joined});
            console.log("index:", joined)
        });

        this.socket.on("tables", (tables: TableData[]) => this.setState({tables}));
    };

    valueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({inputName: e.target.value});
    };

    keyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.which === 13) this.sendName().then(() => {
        });
    };

    render() {
        return (
            <>
                {!this.state.conId ?
                    <NameInput inputName={this.state.inputName} onKeyPress={this.keyPress}
                               onChange={this.valueChange}
                               sendName={this.sendName}/> :
                    (this.state.joined !== -1 ?
                        <Poker socket={this.socket} conId={this.state.conId} index={this.state.joined}/>
                        :
                        <Lobby socket={this.socket} tables={this.state.tables}/>)
                }
            </>
        );
    }
}
