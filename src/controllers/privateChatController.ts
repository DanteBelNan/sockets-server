// controllers/privateChatController.ts
import { Namespace } from 'socket.io';
import { AuthenticatedSocket } from '../types/IAuthenticatedSocket';
import { ChatRoom} from '../types/IChatRoom';

// Interfaz para una sala de chat


// Almacén de salas disponibles
const availableRooms = new Map<string, ChatRoom>();

export const privateChatController = {
  // Manejar la creación de una nueva sala
  handleCreateRoom: (namespace: Namespace, socket: AuthenticatedSocket, data: { id: string; name: string }) => {
    const user = socket.data.user;
    
    const newRoom: ChatRoom = {
      id: data.id,
      name: data.name,
      userCount: 0,
      createdAt: new Date(),
      creatorId: user.id,
      creatorUsername: user.username
    };
    
    availableRooms.set(data.id, newRoom);
    
    // Notificar a todos los clientes sobre la nueva sala
    namespace.emit('room created', newRoom);
    
    console.log(`Sala "${data.name}" (${data.id}) creada por ${user.username}`);
  },
  
  // Manejar la solicitud de lista de salas
  handleGetRooms: (namespace: Namespace, socket: AuthenticatedSocket) => {
    const roomsList = Array.from(availableRooms.values());
    socket.emit('rooms list', roomsList);
  },
  
  // Manejar cuando un usuario se une a una sala
  handleJoinRoom: (namespace: Namespace, socket: AuthenticatedSocket, roomId: string) => {
    const user = socket.data.user;
    
    // Verificar si la sala existe
    const room = availableRooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'La sala no existe' });
      return;
    }
    
    // Unir al socket a la sala
    socket.join(roomId);
    
    // Incrementar el conteo de usuarios
    room.userCount++;
    availableRooms.set(roomId, room);
    
    // Notificar a todos en la sala sobre el nuevo usuario
    namespace.to(roomId).emit('user joined', {
      roomId,
      userId: user.id,
      username: user.username,
      count: room.userCount,
      timestamp: new Date()
    });
    
    console.log(`Usuario ${user.username} (ID: ${user.id}) se unió a la sala ${roomId}`);
  },

  handleDeleteRoom: (namespace: Namespace, socket: AuthenticatedSocket, roomId: string) => {
    const user = socket.data.user;
    const room = availableRooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'La sala no existe' });
      return;
    }
    
    // Verificar si el usuario es el creador (opcional)
    if (room.creatorId && room.creatorId !== user.id) {
      socket.emit('error', { message: 'No tienes permiso para eliminar esta sala' });
      return;
    }
    
    // Notificar a todos los usuarios en la sala que será eliminada
    namespace.to(roomId).emit('room deleted', {
      roomId,
      message: `Esta sala ha sido eliminada por ${user.username}`,
      deletedBy: {
        id: user.id,
        username: user.username
      },
      timestamp: new Date()
    });
    
    // Hacer que todos los usuarios abandonen la sala
    namespace.in(roomId).socketsLeave(roomId);
    
    // Eliminar la sala del mapa
    availableRooms.delete(roomId);
    
    // Notificar a todos los clientes que la sala ha sido eliminada
    namespace.emit('room deleted', roomId);
    
    console.log(`Sala ${roomId} eliminada por el usuario ${user.username} (ID: ${user.id})`);
  },
  
  // Manejar cuando un usuario abandona una sala
  handleLeaveRoom: (namespace: Namespace, socket: AuthenticatedSocket, roomId: string) => {
    const user = socket.data.user;
    const room = availableRooms.get(roomId);
    
    if (room && room.userCount > 0) {
      // Decrementar el conteo de usuarios
      room.userCount--;
      availableRooms.set(roomId, room);
      
      // Eliminar la sala si ya no hay usuarios (opcional)
      if (room.userCount === 0 && availableRooms.has(roomId)) {
        availableRooms.delete(roomId);
        namespace.emit('room deleted', roomId);
      } else {
        // Notificar a los usuarios restantes
        namespace.to(roomId).emit('user left', {
          roomId,
          userId: user.id,
          username: user.username,
          count: room.userCount,
          timestamp: new Date()
        });
      }
    }
    
    // Hacer que el socket abandone la sala
    socket.leave(roomId);
    
    console.log(`Usuario ${user.username} (ID: ${user.id}) abandonó la sala ${roomId}`);
  },
  
  // Manejar mensajes de chat
  handleChatMessage: (namespace: Namespace, socket: AuthenticatedSocket, data: any, roomId: string) => {
    const user = socket.data.user;
    const { message } = data;
    
    // Enviar el mensaje a la sala específica
    namespace.to(roomId).emit('chat message', {
      id: socket.id,
      userId: user.id,
      username: data.username,
      message,
      timestamp: new Date(),
      room: roomId
    });
  },
  
  // Manejar desconexión del usuario
  handleDisconnect: (namespace: Namespace, socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    console.log(`Usuario ${user.username} (ID: ${user.id}) desconectado del chat privado`);
    
    // Verificar todas las salas para ver si el usuario estaba en alguna
    socket.rooms.forEach(roomId => {
      // Ignorar la sala por defecto (el ID del socket)
      if (roomId !== socket.id) {
        // Usar el método handleLeaveRoom para actualizar los contadores
        privateChatController.handleLeaveRoom(namespace, socket, roomId);
      }
    });
  }
};