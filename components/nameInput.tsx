import React from "react";
import Styled from "styled-components";

const Img = Styled.img`
    width: 200px;
    height: 300px;
    position: absolute;
    left: calc(50% - 100px);
    top: 100px;
`;

const Box = Styled.div`
    width: 400px;
    position: absolute;
    left: calc(50% - 200px);
    top: 450px;
    text-align: center;
`;

const NameText = Styled.p`
    font-size: 40px;
`;

const Input = Styled.input`
    font-size: 22px;
    padding: 10px;
    margin-bottom: 20px;
`;

const Button = Styled.div`
    font-size: 22px;
    padding: 10px;
    margin-bottom: 20px;
    border: 1px solid lightgrey;
    color: white;
    background-color: black;
    transition: 1s;
    cursor: pointer;
    
    &:hover {
        background-color: #ea442c;
    }
`;

interface NameProps {
    inputName: string,
    onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    sendName: () => void
}

export const NameInput = (props: NameProps) => (
    <>
        <Img src="/ace.jpg"/>
        <Box>
            <NameText>Please enter your name</NameText>
            <Input type={"text"} value={props.inputName} onKeyPress={props.onKeyPress} onChange={props.onChange}/>
            <Button onClick={props.sendName}>Send name</Button>
        </Box>
    </>
);