import React from 'react';
import Styled from "styled-components";

const Button = Styled.button`
    margin: 20px;
    padding: 10px;
    border: 1px solid black;
    background-color: white;
    transition: 1s;
    width: 200px;
    text-align: center;
    cursor: pointer;
    
    &:hover {
        color: white;
        background-color: black;
    }
`;


interface PropsList {
    conId: string,
    members: string[],
    callRemote: (user: string) => void
}

export const UserList = ({conId, members, callRemote}: PropsList) => (
    <div>
        {members.map(member => <p key={member}>
            {member != conId ? <Button onClick={() => callRemote(member)}
            >{`Call ${member.split("_")[0]}`}
            </Button> : <span>{`you (${conId.split("_")[0]})`}</span>}
        </p>)}
    </div>
);