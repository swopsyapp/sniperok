import { io, Socket } from 'socket.io-client';

import { logger } from '$lib/logger';

export interface Message {
    type: string;
    sender: string;
    text: string;
}

export interface Action {
    url: string,
    prompt: string,
    promptClass: string
}

export interface ActionableMessage extends Message {
    actions: Action[];
}

const worldMessages: ActionableMessage[] = $state([]);
const userMessages: ActionableMessage[] = $state([]);
const gameMessages: ActionableMessage[] = $state([]);

export class ClientMessageHandler {
    private static instance: ClientMessageHandler;

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
        this.instance = new ClientMessageHandler();
        return this.instance;
    }

    public getMessages(context: string): ActionableMessage[] {
        return context == 'gameChat'
            ? gameMessages
            : context == 'userChat'
              ? userMessages
              : worldMessages;
    }

    public getWorldMessages(): ActionableMessage[] {
        return worldMessages;
    }

    public getUserMessages(): ActionableMessage[] {
        return userMessages;
    }

    public getGameMessages(): ActionableMessage[] {
        return gameMessages;
    }

    public addWorldMessage(messageType: string, messageSender: string, messageText: string) {
        logger.debug(messageText);
        const msg = {} as ActionableMessage;
        msg.type = messageType;
        msg.sender = messageSender;
        msg.text = messageText;
        if (messageType == 'welcome') {
            const buddyname = messageText.slice(messageText.indexOf('@') + 1);
            const addBuddyAction = {} as Action;
            addBuddyAction.url = '/buddies?action=add&buddyName='+buddyname;
            addBuddyAction.prompt = '+';
            addBuddyAction.promptClass = 'font-extrabold text-green-600';
            msg.actions = [addBuddyAction];
        }
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

export const clientMessageHandler = ClientMessageHandler.getInstance();
