import { Namespace, Socket } from 'socket.io';
import { IMessage } from '../types/IMessage';

export const chatController = {
  handleConnection: (chatNamespace: Namespace, socket: Socket) => {
  },

  handleDisconnect: (chatNamespace: Namespace, socket: Socket) => {
  },

  handleChatMessage: (chatNamespace: Namespace, socket: Socket, data: IMessage) => {
    chatNamespace.emit('chat message', { username: data["username"], message: data["message"], senderId: socket.id });
  },

  connectedUsers: (chatNamespace: Namespace, amount: Number) => {
    chatNamespace.emit('user count', amount);
  }


};