import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  userSockets: Map<string, string> = new Map();
  socketUsers: Map<string, string> = new Map();

  handleConnection(socket: Socket) {
    console.log('User connected:', socket.id);
  }

  handleDisconnect(socket: Socket) {
    const userId = this.socketUsers.get(socket.id);
    if (userId) {
      this.userSockets.delete(userId);
      this.socketUsers.delete(socket.id);
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @MessageBody() userId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    this.userSockets.set(userId, socket.id);
    this.socketUsers.set(socket.id, userId);
    socket.join(`user:${userId}`);
    console.log(`User ${userId} authenticated with socket ${socket.id}`);
    socket.emit('authenticated', { userId, socketId: socket.id });
  }
}
