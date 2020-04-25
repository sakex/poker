import React, {useState} from "react";
import Styled from "styled-components";

const Title = Styled.h1`
    width: 100%;
    text-align: center;
    position: absolute;
    top: 120px;
`;

const Table = Styled.table`
    width: 800px;
    max-height: 500px;
    overflow: auto;
    position: absolute;
    top: 200px;
    left: calc(50% - 400px);
    border: 1px solid lightgrey;
    border-collapse: collapse;
`;

const Th = Styled.th`
    height: 1em;
    padding: 5px;
`;

const Tr = Styled.tr`
    height: 1em;
    padding: 5px;
    text-align: center;
    
    &:nth-child(even) {
      background-color: #dddddd;
    }
`;

const Td = Styled.td`
`;

const NameBox = Styled.div`
    padding: 20px;
    width: 300px;
    position: absolute;
    left: calc(50% - 170px);
    bottom: 150px;
    text-align: center;
`;

const CreateButton = Styled.div`
    padding: 20px;
    text-align: center;
    transition: 1s;
    cursor: pointer;
    border: 1px solid lightgrey;
    margin: 20px;
    
    &:hover {
        background-color: black;
        color: white;
    }
`;

const Input = Styled.input`
    padding: 20px;
    text-align: center;
    border: 1px solid lightgrey;
`;

const JoinButton = Styled.div`
    padding: 5px;
    cursor: pointer;
    border-radius: 5px;
    background-color: white;
    border: 1px solid lightgrey;
    margin: 5px;
    transition: .5s;
    
    &:hover {
        background-color: black;
        color: white;
    }
`;

export interface TableData {
    id: string,
    players: number
}

export const Lobby = (props: { tables: TableData[], socket: SocketIOClient.Socket }) => {
    const [tableName, setName] = useState<string>();

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };

    const sendCreate = () => {
        props.socket.emit("create", tableName);
    };

    return (
        <>
            <Title>Tables list</Title>
            <Table>
                <tbody>
                <Tr key={"title"}>
                    <Th>Name</Th>
                    <Th>Players</Th>
                    <Th>Join</Th>
                </Tr>
                {props.tables.map(table => <Tr key={table.id}>
                    <Td>{table.id.split("_")[0]}</Td>
                    <Td>{table.players}</Td>
                    <Td>
                        <JoinButton onClick={() => {
                            props.socket.emit("join", table.id);
                        }}>Join</JoinButton></Td>
                </Tr>)}
                </tbody>
            </Table>
            <NameBox>
                <p>Create table</p>
                <Input type="text" onChange={onChange} value={tableName}/>
                <CreateButton onClick={sendCreate}>CREATE</CreateButton>
            </NameBox>
        </>
    );
};