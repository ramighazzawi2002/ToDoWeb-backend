import { Injectable } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class SendNotificationToUserService {
  constructor(private readonly chatGateway: ChatGateway) {}

  sendNotificationToUser(userId: string, eventName: string, data: any): void {
    const io = this.chatGateway.server;
    const socketId = this.chatGateway.userSockets.get(userId);

    console.log(`🔔 Attempting to send notification to user: ${userId}`);
    console.log(`📡 Event: ${eventName}`);
    console.log(`📦 Data:`, data);
    console.log(`🔍 Socket ID for user ${userId}:`, socketId);

    if (socketId) {
      io.to(`user:${userId}`).emit(eventName, data);
      console.log(`✅ Notification sent successfully`);
    } else {
      console.log(`❌ User ${userId} not found in connected users`);
    }
  }
}
