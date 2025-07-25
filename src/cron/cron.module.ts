import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OptimizedCronService } from './optimizedCronJobs.service';
import { CronCacheService } from './CronCache.service';
import { SendNotificationToUserService } from './sendNotficationToUser.service';
import { ChatGateway } from './chat.gateway';
import { User, UserSchema } from '../schema/user.schema';
import { ToDoList, ToDoListSchema } from '../schema/todo-list.schema';
import { ToDoItem, ToDoItemSchema } from '../schema/todo-item.schema';
import Redis from 'ioredis';
import { KeepAliveCronService } from './keepAlive-cron.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: ToDoList.name, schema: ToDoListSchema },
    ]),
    MongooseModule.forFeature([
      { name: ToDoItem.name, schema: ToDoItemSchema },
    ]),
  ],
  providers: [
    OptimizedCronService,
    CronCacheService,
    SendNotificationToUserService,
    ChatGateway,
    KeepAliveCronService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
        });
      },
    },
  ],
  exports: [
    OptimizedCronService,
    CronCacheService,
    SendNotificationToUserService,
    ChatGateway,
  ],
})
export class CronModule {}
