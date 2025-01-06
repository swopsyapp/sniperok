import { io, Socket } from 'socket.io-client';

import { get } from 'svelte/store';
import { page } from '$app/stores';

import { logger } from '$lib/logger';
import type { User } from '@supabase/supabase-js';

export interface Message {
    type: string;
    sender: string;
    receiver: string | undefined;
    text: string;
}

export interface Action {
    url: string;
    prompt: string;
    promptClass: string;
}

export interface ActionableMessage extends Message {
    actions: Action[];
}

const worldMessages: ActionableMessage[] = $state([]);
const userMessages: ActionableMessage[] = $state([]);
const gameMessages: ActionableMessage[] = $state([]);

export class ClientMessageHandler {
    private static instance: ClientMessageHandler | undefined;

    private socket: Socket | undefined;
    private username : string | undefined;

    private constructor() {
    }

    static getInstance() {
        if (ClientMessageHandler.instance) {
            return ClientMessageHandler.instance;
        }
        ClientMessageHandler.instance = new ClientMessageHandler();
        return ClientMessageHandler.instance;
    }

    public connect() : Socket {
        const currentPage = get(page);
        const user : User = currentPage.data?.user;
        const pageUsername = ( user && !user.is_anonymous ) ? user.user_metadata.username : undefined;
        
        if (this.socket?.connected) {
            if (this.username == pageUsername) {
                return this.socket;
            } else {
                logger.debug('User changed, disconnecting ', this.username);
                this.socket.disconnect();
                this.socket.removeAllListeners();
                this.username = pageUsername;
            }
        }

        const options = this.username ? { query: { username: this.username } } : undefined;
        this.socket = io(options);

        this.socket
            .on('eventFromServer', (message) => {
                logger.debug('eventFromServer', message);
            })
            .on('worldChat', (message) => {
                this.addWorldMessage(message.type, message.sender, message.text);
            })
            .on('userChat', (message) => {
                this.addUserMessage(message);
            });
        
        logger.debug('socket connected as ', this.username);
        return this.socket;
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
            addBuddyAction.url = '/buddies?action=add&buddyName=' + buddyname;
            addBuddyAction.prompt = '+';
            addBuddyAction.promptClass = 'font-extrabold text-green-600';
            msg.actions = [addBuddyAction];
        }
        worldMessages.push(msg);
    }

    public addUserMessage(message: Message) {
        logger.debug(message);
        const msg = {} as ActionableMessage;
        msg.type = message.type;
        msg.sender = message.sender;
        msg.receiver = message.receiver;
        msg.text = message.text;
        userMessages.push(msg);
    }

    public sendWorldMessage(messageSender: string, messageText: string) {
        if (messageText) {

            const currentPage = get(page);
            const user : User = currentPage.data?.user;
            if (!user || user.is_anonymous) {
                logger.warn('Unregistered users cannot send worldChat');
                return;
            }
            const username = user.user_metadata.username;
            logger.debug('sender = ', username);
    
            const msg = {} as Message;
            msg.type = 'worldChat';
            msg.sender = messageSender;
            msg.text = messageText;

            if (!this.socket || this.socket.disconnected) {
                this.socket = this.connect();
            }
            this.socket.emit('worldChat', msg);
            logger.debug('sent @', messageSender, ' : ', messageText);
        } else {
            logger.warn('Not sent, messageText is empty');
        }
    }

    public sendUserMessage(messageSender: string, messageText: string) {
        if (messageText) {

            const currentPage = get(page);
            const user : User = currentPage.data?.user;
            if (!user || user.is_anonymous) {
                logger.warn('Unregistered users cannot send userChat');
                return;
            }
            const username = user.user_metadata.username;
            logger.debug('sender = ', username);
    
            // TODO validate the receiver is a buddy
            // messagetext = '@user1 hello' ... receiver = 'user1'
            const receiver = messageText.split(" ")[0].slice(1);
            const strippedMessageText = messageText.slice(messageText.indexOf(' '));
            
            const msg = {} as Message;
            msg.type = 'worldChat';
            msg.sender = messageSender;
            msg.receiver = receiver;
            msg.text = strippedMessageText;

            if (!this.socket || this.socket.disconnected) {
                this.socket = this.connect();
            }
            this.socket.emit('userChat', msg);
            this.addUserMessage(msg);
            logger.debug('sent @', messageSender, ' : ', messageText);
        } else {
            logger.warn('Not sent, messageText is empty');
        }
    }

    public sendGameMessage(gameId: number, messageSender: string, messageText: string) {
        if (messageText) {

            const currentPage = get(page);
            const user : User = currentPage.data?.user;
            if (!user) {
                logger.warn('You must be logged in to send gameChat');
                return;
            }

            const msg = {} as Message;
            msg.type = 'gameChat';
            msg.sender = messageSender;
            msg.text = messageText;

            if (!this.socket || this.socket.disconnected) {
                this.socket = this.connect();
            }
            this.socket.emit('worldChat', msg);
            logger.debug('sent @', messageSender, ' : ', messageText);
        } else {
            logger.warn('Not sent, messageText is empty');
        }
    }

    public logout() {
        userMessages.length = 0;
        gameMessages.length = 0;
        if (this.socket) {
            this.socket.disconnect();
            this.socket.removeAllListeners();
        }
        
        const currentPage = get(page);
        const user : User = currentPage.data?.user;
        if (user) {
            logger.info('Logging out user ', user.user_metadata.username ?? user.id);
            currentPage.data.user = undefined;
        }

        logger.debug('socket disconnected');
    }

    public clearAll() {
        worldMessages.length = 0;
        userMessages.length = 0;
        gameMessages.length = 0;
    }
}

export const clientMessageHandler = ClientMessageHandler.getInstance();
