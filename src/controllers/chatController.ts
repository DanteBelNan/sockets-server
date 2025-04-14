// controllers/chatController.ts
import { Namespace } from 'socket.io';
import { AuthenticatedSocket } from '../types/IAuthenticatedSocket';
import { IMessage } from '../types/IMessage';

export const chatController = {
  handleConnection: (chatNamespace: Namespace, socket: AuthenticatedSocket) => {
    // Ahora podemos acceder a la información del usuario
    const user = socket.data.user;
    console.log(`Usuario ${user.username} (ID: ${user.id}) conectado al chat general`);
    
    // Opcionalmente, notificar a todos sobre la conexión del usuario
    chatNamespace.emit('user connected', {
      username: user.username,
      userId: user.id,
      timestamp: new Date()
    });
  },

  handleDisconnect: (chatNamespace: Namespace, socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    console.log(`Usuario ${user.username} (ID: ${user.id}) desconectado del chat general`);
    
    // Opcionalmente, notificar a todos sobre la desconexión
    chatNamespace.emit('user disconnected', {
      username: user.username,
      userId: user.id,
      timestamp: new Date()
    });
  },

  handleChatMessage: (chatNamespace: Namespace, socket: AuthenticatedSocket, data: IMessage) => {
    const user = socket.data.user;

    
    // Usar la información del usuario autenticado en lugar de confiar solo en los datos del mensaje
    chatNamespace.emit('chat message', { 
      username: data.username,  // Usar el nombre del token JWT
      userId: user.id,          // Añadir el ID del usuario
      message: data.message,
      senderId: socket.id,      // Mantener el ID del socket para compatibilidad
      timestamp: new Date()
    });
  },

  connectedUsers: (chatNamespace: Namespace, amount: Number) => {
    chatNamespace.emit('user count', amount);
  }
};