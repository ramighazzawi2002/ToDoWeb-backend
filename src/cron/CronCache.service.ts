import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ToDoItem } from '../schema/todo-item.schema';
import { ToDoList } from '../schema/todo-list.schema';
import { Redis } from 'ioredis';

@Injectable()
export class CronCacheService {
  private readonly CACHE_KEYS = {
    DUE_TASKS: 'cron:due_tasks',
    OVERDUE_TASKS: 'cron:overdue_tasks',
    USER_TASKS_PREFIX: 'cron:user_tasks:',
    LAST_NOTIFICATION_PREFIX: 'cron:last_notif:',
  };

  private readonly CACHE_TTL = {
    TASKS: 300, // 5 minutes
    NOTIFICATIONS: 7200, // 2 hours
  };

  constructor(
    @InjectModel(ToDoItem.name) private toDoItemModel: Model<ToDoItem>,
    @InjectModel(ToDoList.name) private toDoListModel: Model<ToDoList>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async getDueTasks(thirtyMinutesFromNow: Date, now: Date): Promise<any> {
    const cacheKey = `${this.CACHE_KEYS.DUE_TASKS}:${now.getTime()}:${thirtyMinutesFromNow.getTime()}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log('📋 Using cached due tasks');
        return JSON.parse(cached);
      }
      console.log('🔍 Fetching due tasks from database');
      const dueTasks = await this.toDoItemModel
        .find({
          completed: false,
          isDeleted: false,
          dueDate: { $gte: now, $lte: thirtyMinutesFromNow },
        })
        .populate({
          path: 'toDoListId',
          model: 'ToDoList',
          select: 'userId title',
          match: { isDeleted: false },
        })
        .lean();
      await this.redis.setex(
        cacheKey,
        this.CACHE_TTL.TASKS,
        JSON.stringify(dueTasks),
      );
      return dueTasks;
    } catch (error) {
      console.error('❌ Error in getDueTasks cache:', error);
      return await this.toDoItemModel
        .find({
          completed: false,
          isDeleted: false,
          dueDate: { $gte: now, $lte: thirtyMinutesFromNow },
        })
        .populate({
          path: 'toDoListId',
          model: 'ToDoList',
          select: 'userId title',
          match: { isDeleted: false },
        })
        .lean();
    }
  }

  async getOverdueTasks(now: Date): Promise<any> {
    const cacheKey = `${this.CACHE_KEYS.OVERDUE_TASKS}:${now.getTime()}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log('📋 Using cached overdue tasks');
        return JSON.parse(cached);
      }
      console.log('🔍 Fetching overdue tasks from database');
      const overdueTasks = await this.toDoItemModel
        .find({
          completed: false,
          isDeleted: false,
          dueDate: { $lt: now },
        })
        .populate({
          path: 'toDoListId',
          model: 'ToDoList',
          select: 'userId title',
          match: { isDeleted: false },
        })
        .lean();
      await this.redis.setex(
        cacheKey,
        this.CACHE_TTL.TASKS,
        JSON.stringify(overdueTasks),
      );
      return overdueTasks;
    } catch (error) {
      console.error('❌ Error in getOverdueTasks cache:', error);
      return await this.toDoItemModel
        .find({
          completed: false,
          isDeleted: false,
          dueDate: { $lt: now },
        })
        .populate({
          path: 'toDoListId',
          model: 'ToDoList',
          select: 'userId title',
          match: { isDeleted: false },
        })
        .lean();
    }
  }

  async wasRecentlyNotified(
    taskId: string,
    notificationType: 'reminder' | 'overdue',
    cooldownMinutes = 25,
  ): Promise<boolean> {
    const key = `${this.CACHE_KEYS.LAST_NOTIFICATION_PREFIX}${notificationType}:${taskId}`;
    try {
      const lastNotified = await this.redis.get(key);
      if (!lastNotified) return false;
      const lastNotifiedTime = parseInt(lastNotified);
      const now = Date.now();
      const cooldownMs = cooldownMinutes * 60 * 1000;
      return now - lastNotifiedTime < cooldownMs;
    } catch (error) {
      console.error('❌ Error checking notification cache:', error);
      return false;
    }
  }

  async markAsNotified(
    taskId: string,
    notificationType: 'reminder' | 'overdue',
  ): Promise<void> {
    const key = `${this.CACHE_KEYS.LAST_NOTIFICATION_PREFIX}${notificationType}:${taskId}`;
    const now = Date.now();
    try {
      await this.redis.setex(key, this.CACHE_TTL.NOTIFICATIONS, now.toString());
    } catch (error) {
      console.error('❌ Error marking notification in cache:', error);
    }
  }

  async getUserTasksSummary(userId: string): Promise<string[]> {
    const key = `${this.CACHE_KEYS.USER_TASKS_PREFIX}${userId}`;
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('❌ Error getting user tasks summary:', error);
      return [];
    }
  }

  async cacheUserTasksSummary(
    userId: string,
    taskIds: string[],
  ): Promise<void> {
    const key = `${this.CACHE_KEYS.USER_TASKS_PREFIX}${userId}`;
    try {
      await this.redis.setex(
        key,
        this.CACHE_TTL.TASKS,
        JSON.stringify(taskIds),
      );
    } catch (error) {
      console.error('❌ Error caching user tasks summary:', error);
    }
  }

  async cleanupOldCache(): Promise<void> {
    try {
      const pattern = `${this.CACHE_KEYS.LAST_NOTIFICATION_PREFIX}*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return;
      const now = Date.now();
      const twoHoursMs = 2 * 60 * 60 * 1000;
      const keysToDelete: string[] = [];
      for (const key of keys) {
        try {
          const value = await this.redis.get(key);
          if (value) {
            const timestamp = parseInt(value);
            if (now - timestamp > twoHoursMs) {
              keysToDelete.push(key);
            }
          }
        } catch (error) {
          keysToDelete.push(key);
        }
      }
      if (keysToDelete.length > 0) {
        await this.redis.del(...keysToDelete);
        console.log(`🧹 Cleaned up ${keysToDelete.length} old cache entries`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up cache:', error);
    }
  }

  async invalidateTasksCache(): Promise<void> {
    try {
      const patterns = [
        `${this.CACHE_KEYS.DUE_TASKS}*`,
        `${this.CACHE_KEYS.OVERDUE_TASKS}*`,
      ];
      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
      console.log('🧹 Invalidated tasks cache');
    } catch (error) {
      console.error('❌ Error invalidating tasks cache:', error);
    }
  }
}
