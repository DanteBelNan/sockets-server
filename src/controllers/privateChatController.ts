import { Namespace, Socket } from 'socket.io';

// Interfaz para una sala de chat
interface ChatRoom {
  id: string;
  name: string;
  userCount: number;
  createdAt: Date;
}

// Almacén de salas disponibles
const availableRooms = new Map<string, ChatRoom>();

export const privateChatController = {
  // Manejar la creación de una nueva sala
  handleCreateRoom: (namespace: Namespace, socket: Socket, data: { id: string; name: string }) => {
    const newRoom: ChatRoom = {
      id: data.id,
      name: data.name,
      userCount: 0,
      createdAt: new Date()
    };
    
    availableRooms.set(data.id, newRoom);
    
    // Notificar a todos los clientes sobre la nueva sala
    namespace.emit('room created', newRoom);
    
    console.log(`Sala creada: ${data.name} (${data.id})`);
  },
  
  // Manejar la solicitud de lista de salas
  handleGetRooms: (namespace: Namespace, socket: Socket) => {
    const roomsList = Array.from(availableRooms.values());
    socket.emit('rooms list', roomsList);
  },
  
  // Manejar cuando un usuario se une a una sala
  handleJoinRoom: (namespace: Namespace, socket: Socket, roomId: string) => {
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
    namespace.to(roomId).emit('room users updated', {
      roomId,
      count: room.userCount
    });
    
    console.log(`Usuario ${socket.id} se unió a la sala ${roomId}`);
  },

  handleDeleteRoom: (namespace: Namespace, socket: Socket, roomId: string) => {
    const room = availableRooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'La sala no existe' });
      return;
    }
    
    // Notificar a todos los usuarios en la sala que será eliminada
    namespace.to(roomId).emit('room deleted', {
      roomId,
      message: 'Esta sala ha sido eliminada'
    });
    
    // Hacer que todos los usuarios abandonen la sala
    namespace.in(roomId).socketsLeave(roomId);
    
    // Eliminar la sala del mapa
    availableRooms.delete(roomId);
    
    // Notificar a todos los clientes que la sala ha sido eliminada
    namespace.emit('room deleted', roomId);
    
    console.log(`Sala ${roomId} eliminada por el usuario ${socket.id}`);
  },
  
  // Manejar cuando un usuario abandona una sala
  handleLeaveRoom: (namespace: Namespace, socket: Socket, roomId: string) => {
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
        namespace.to(roomId).emit('room users updated', {
          roomId,
          count: room.userCount
        });
      }
    }
    
    // Hacer que el socket abandone la sala
    socket.leave(roomId);
    
    console.log(`Usuario ${socket.id} abandonó la sala ${roomId}`);
  },
  
  // Manejar mensajes de chat
  handleChatMessage: (namespace: Namespace, socket: Socket, data: any, roomId: string) => {
    const { message, username } = data;
    
    // Enviar el mensaje a la sala específica
    namespace.to(roomId).emit('chat message', {
      id: socket.id,
      message,
      username: username || 'Usuario',
      timestamp: new Date(),
      room: roomId
    });
  },
  
  // Manejar desconexión del usuario
  handleDisconnect: (namespace: Namespace, socket: Socket) => {
    console.log(`Usuario ${socket.id} desconectado del chat privado`);
    
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