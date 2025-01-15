import { io, Socket } from 'socket.io-client';

import { get } from 'svelte/store';
import { page } from '$app/stores';

import { logger } from '$lib/logger';
import type { User } from '@supabase/supabase-js';

export enum MessageType {
    GameChat = 'gameChat',
    JoinGame = 'joinGame',
    StartRound = 'startRound',
    UserChat = 'userChat',
    Welcome = 'welcome',
    WorldChat = 'worldChat'
}

export interface Message {
    type: string;
    sender: string;
    receiver: string | undefined;
    gameId: string | undefined;
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    private messageTypeCallbackMap = new Map<MessageType, Function>();

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
            .on(MessageType.WorldChat, (message) => {
                this.addWorldMessage(message.type, message.sender, message.text);
            })
            .on(MessageType.UserChat, (message) => {
                this.addUserMessage(message);
            })
            .on(MessageType.GameChat, (message) => {
                this.addGameMessage(message);
            });
        
        logger.debug('socket connected as ', this.username);
        return this.socket;
    }

    public getMessages(context: string): ActionableMessage[] {
        return context == MessageType.GameChat
            ? gameMessages
            : context == MessageType.UserChat
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
        logger.trace('worldChat received ', messageText);
        const msg = {} as ActionableMessage;
        msg.type = messageType;
        msg.sender = messageSender;
        msg.text = messageText;
        if (messageType == MessageType.Welcome) {
            const buddyname = messageText.slice(messageText.indexOf('@') + 1);
            const addBuddyAction = {} as Action;
            addBuddyAction.url = '/buddies?action=add&buddyName=' + buddyname;
            addBuddyAction.prompt = '+';
            addBuddyAction.promptClass = 'font-extrabold text-green-600';
            msg.actions = [addBuddyAction];
        }
        worldMessages.push(msg);
    }

    public addGameMessage(gameMessage: Message) {
        logger.trace('gameChat received ', gameMessage);
        const msg = {} as ActionableMessage;
        msg.type = gameMessage.type;
        msg.sender = gameMessage.sender;
        msg.gameId = gameMessage.gameId;
        msg.text = gameMessage.text;
        if (msg.type == MessageType.JoinGame) {
            msg.text = 'joined';
        } else if (msg.type == MessageType.StartRound) {
            msg.text = 'round #' + msg.text;
        }
        gameMessages.push(msg);
        this.notifySubscribers(msg);
    }

    public addUserMessage(message: Message) {
        logger.trace('userChat received ', message);
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
            logger.trace('sender = ', username);
    
            const msg = {} as Message;
            msg.type = MessageType.WorldChat;
            msg.sender = messageSender;
            msg.text = messageText;

            if (!this.socket || this.socket.disconnected) {
                this.socket = this.connect();
            }
            this.socket.emit(msg.type, msg);
            logger.debug('sent worldChat @', messageSender, ' : ', messageText);
        } else {
            logger.debug('Not sent, messageText is empty');
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
            logger.trace('sender = ', username);
    
            // TODO validate the receiver is a buddy
            // messagetext = '@user1 hello' ... receiver = 'user1'
            const receiver = messageText.split(" ")[0].slice(1);
            const strippedMessageText = messageText.slice(messageText.indexOf(' '));
            
            const msg = {} as Message;
            msg.type = MessageType.UserChat;
            msg.sender = messageSender;
            msg.receiver = receiver;
            msg.text = strippedMessageText;

            if (!this.socket || this.socket.disconnected) {
                this.socket = this.connect();
            }
            this.socket.emit(msg.type, msg);
            this.addUserMessage(msg);
            logger.debug('sent userChat @', messageSender, ' : ', messageText);
        } else {
            logger.debug('Not sent, messageText is empty');
        }
    }

    public joinGameChannel(gameId: string, playerSeq: number) {
        const currentPage = get(page);
        const user : User = currentPage.data?.user;
        if (!user) {
            logger.warn('Unregistered users cannot join games');
            return;
        }
        const username = user.user_metadata.username ?? `guest#${playerSeq}`;
        logger.trace('sender = ', username);

        const msg = {} as Message;
        msg.type = MessageType.JoinGame;
        msg.sender = username;
        msg.gameId = gameId;

        if (!this.socket || this.socket.disconnected) {
            this.socket = this.connect();
        }
        this.socket.emit(msg.type, msg);
        logger.debug('joining gameRoom @', username, ' : ', gameId);
    }

    public sendGameMessage(gameId: string, messageSender: string, messageText: string) {
        if (messageText) {

            const currentPage = get(page);
            const user : User = currentPage.data?.user;
            if (!user) {
                logger.warn('You must be logged in to send gameChat');
                return;
            }

            const msg = {} as Message;
            msg.type = MessageType.GameChat;
            msg.sender = messageSender;
            msg.gameId = gameId;
            msg.text = messageText;

            if (!this.socket || this.socket.disconnected) {
                this.socket = this.connect();
            }
            this.socket.emit(msg.type, msg);
            logger.debug('sent gameChat @', messageSender, ' : ', msg.text);
        } else {
            logger.debug('Not sent, messageText is empty');
        }
    }

    public sendStartRound(gameId: string, messageSender: string, roundSeq: number) {
        const currentPage = get(page);
        const user : User = currentPage.data?.user;
        if (!user) {
            logger.warn('You must be logged in to send startRound');
            return;
        }

        const msg = {} as Message;
        msg.type = MessageType.StartRound;
        msg.sender = messageSender;
        msg.gameId = gameId;
        msg.text = roundSeq.toString();

        if (!this.socket || this.socket.disconnected) {
            this.socket = this.connect();
        }
        this.socket.emit(msg.type, msg);
        logger.debug('sent startRound @', messageSender, ' : ', msg.text);
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

    public on(messageType: MessageType, callback: (message: Message) => void) {
        this.messageTypeCallbackMap.set(messageType, callback);
    }

    // TODO : Is this really necessary?
    public static messageTypeTextToEnum(messageType: string) : MessageType | undefined {
        switch (messageType) {
            case MessageType.GameChat:
                return MessageType.GameChat
            case MessageType.JoinGame:
                return MessageType.JoinGame;
            case MessageType.StartRound:
                return MessageType.StartRound;
            case MessageType.UserChat:
                return MessageType.UserChat;
            case MessageType.Welcome:
                return MessageType.Welcome;
            case MessageType.WorldChat:
                return MessageType.WorldChat;
            default:
                return undefined;
        }
    }

    private notifySubscribers(message: Message) {
        const msgType = ClientMessageHandler.messageTypeTextToEnum(message.type);
        if ( msgType && this.messageTypeCallbackMap.has(msgType) ) {
            const subscriber = this.messageTypeCallbackMap.get(msgType);
            if (subscriber) {
                subscriber(message);
            }
        }

    }
}

export const clientMessageHandler = ClientMessageHandler.getInstance();
