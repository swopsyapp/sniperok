import { io, Socket } from 'socket.io-client';

import { logger } from '$lib/logger';

export interface Message {
    type: string;
    sender: string;
    text: string;
}

const worldMessages: Message[] = $state([]);
const userMessages: Message[] = $state([]);
const gameMessages: Message[] = $state([]);

export class MessageHandler {
    private static instance: MessageHandler;

    private socket: Socket;

    private constructor() {
        this.socket = io();

        this.socket
            .on('eventFromServer', (message) => {
                logger.debug('eventFromServer', message);
            })
            .on('worldChat', (message) => {
                this.addWorldMessage(message.type, message.sender, message.text);
            });
    }

    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new MessageHandler();
        return this.instance;
    }

    public getMessages(context: string): Message[] {
        return context == 'gameChat'
            ? gameMessages
            : context == 'userChat'
              ? userMessages
              : worldMessages;
    }

    public getWorldMessages(): Message[] {
        return worldMessages;
    }

    public getUserMessages(): Message[] {
        return userMessages;
    }

    public getGameMessages(): Message[] {
        return gameMessages;
    }

    public addWorldMessage(messageType: string, messageSender: string, messageText: string) {
        logger.debug(messageText);
        const msg = {} as Message;
        msg.type = messageType;
        msg.sender = messageSender;
        msg.text = messageText;
        worldMessages.push(msg);
    }

    public sendWorldMessage(messageSender: string, messageText: string) {
        if (messageText) {
            const msg = {} as Message;
            msg.type = 'worldChat';
            msg.sender = messageSender;
            msg.text = messageText;

            this.socket.emit('worldChat', msg);
            logger.debug('sent @', messageSender, ' : ', messageText);
        } else {
            logger.warn('Not sent, messageText is empty');
        }
    }

    public logout() {
        userMessages.length = 0;
        gameMessages.length = 0;
    }

    public clearAll() {
        worldMessages.length = 0;
        userMessages.length = 0;
        gameMessages.length = 0;
    }
}

export const messageHandler = MessageHandler.getInstance();
