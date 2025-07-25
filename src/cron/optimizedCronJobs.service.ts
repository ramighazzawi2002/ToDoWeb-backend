import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodeCron from 'node-cron';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schema/user.schema';
import { CronCacheService } from './CronCache.service';
import { SendNotificationToUserService } from './sendNotficationToUser.service';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import {
  generateReminderMessage,
  getPriorityLevel,
  formatTimeRemaining,
  formatOverdueTime,
} from './timeUtility';

dotenv.config();

@Injectable()
export class OptimizedCronService implements OnModuleInit {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.Email,
      clientId: process.env.ClientId,
      clientSecret: process.env.ClientSecret,
      refreshToken: process.env.refreshToken,
    },
  });

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly cronCacheService: CronCacheService,
    private readonly sendNotificationToUser: SendNotificationToUserService,
  ) {}

  async onModuleInit() {
    this.startOptimizedTaskReminderCron();
    this.startOptimizedOverdueTaskCron();
    this.startCacheCleanupCron();
    console.log('🚀 All optimized cron jobs with Redis caching initialized');
  }

  private async sendEmailNotification(
    userEmail: string,
    userName: string,
    subject: string,
    message: string,
    tasks: any[],
  ) {
    try {
      const taskList = tasks
        .map(
          (task, index) =>
            `${index + 1}. ${task.taskTitle} - Due: ${new Date(task.dueDate).toLocaleString('ar-EG', { timeZone: 'Asia/Amman' })}`,
        )
        .join('\n');
      const emailContent = `
مرحباً ${userName},

${message}

تفاصيل المهام:
${taskList}

يمكنك تسجيل الدخول إلى تطبيق المهام لإدارة مهامك.

مع أطيب التحيات،
فريق تطبيق المهام
      `;
      const mailOptions = {
        from: '"تطبيق المهام" <rami.ghazzawiabed@gmail.com>',
        to: userEmail,
        subject: subject,
        text: emailContent,
        html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">مرحباً ${userName}</h2>
          <p style="font-size: 16px; line-height: 1.5;">${message}</p>
          <h3 style="color: #555;">تفاصيل المهام:</h3>
          <ul style="list-style-type: none; padding: 0;">
            ${tasks
              .map(
                (task) => `
              <li style="background: #f5f5f5; margin: 10px 0; padding: 15px; border-radius: 5px;">
                <strong>${task.taskTitle}</strong><br>
                <span style="color: #666;">تاريخ الاستحقاق: ${new Date(task.dueDate).toLocaleString('ar-EG', { timeZone: 'Asia/Amman' })}</span><br>
                <span style="color: #666;">قائمة المهام: ${task.todoListTitle}</span>
              </li>
            `,
              )
              .join('')}
          </ul>
          <p style="margin-top: 30px; color: #666;">
            يمكنك تسجيل الدخول إلى تطبيق المهام لإدارة مهامك.
          </p>
          <hr style="margin: 30px 0; border: 1px solid #eee;">
          <p style="color: #999; font-size: 14px;">
            مع أطيب التحيات،<br>
            فريق تطبيق المهام
          </p>
        </div>
      `,
      };
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`❌ Error sending email to ${userEmail}:`, error);
    }
  }

  private startOptimizedTaskReminderCron() {
    console.log(
      '🕒 Starting optimized task reminder cron job with Redis caching...',
    );
    nodeCron.schedule('*/10 * * * *', async () => {
      console.log(
        '🔍 Checking for tasks due within 30 minutes (with caching)...',
      );
      try {
        const now = new Date();
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
        const dueTasks = await this.cronCacheService.getDueTasks(
          thirtyMinutesFromNow,
          now,
        );
        const tasksByUser = new Map<string, any[]>();
        for (const task of dueTasks) {
          if (!task.toDoListId) continue;
          const todoList = task.toDoListId;
          const userId = todoList.userId.toString();
          const taskId = task._id.toString();
          const wasNotified = await this.cronCacheService.wasRecentlyNotified(
            taskId,
            'reminder',
            25,
          );
          if (wasNotified) continue;
          if (!tasksByUser.has(userId)) tasksByUser.set(userId, []);
          tasksByUser.get(userId)?.push({
            task,
            todoList,
            timeRemainingMs: new Date(task.dueDate).getTime() - now.getTime(),
          });
        }
        for (const [userId, userTasks] of tasksByUser) {
          userTasks.sort((a, b) => a.timeRemainingMs - b.timeRemainingMs);
          let message: string;
          let priority: string;
          if (userTasks.length === 1) {
            const taskInfo = userTasks[0];
            const timeRemainingMinutes = Math.ceil(
              taskInfo.timeRemainingMs / (1000 * 60),
            );
            message = generateReminderMessage(
              taskInfo.task.title,
              timeRemainingMinutes,
            );
            priority = getPriorityLevel(timeRemainingMinutes);
          } else {
            const taskTitles = userTasks
              .slice(0, 3)
              .map((taskInfo) => {
                const timeRemainingMinutes = Math.ceil(
                  taskInfo.timeRemainingMs / (1000 * 60),
                );
                return `"${taskInfo.task.title}" (${formatTimeRemaining(timeRemainingMinutes)})`;
              })
              .join('، ');
            const totalTasks = userTasks.length;
            const remainingTasks =
              totalTasks > 3 ? ` و ${totalTasks - 3} مهام أخرى` : '';
            message = `🔔 لديك ${totalTasks} مهام مستحقة قريباً: ${taskTitles}${remainingTasks}`;
            const mostUrgentTime = Math.ceil(
              userTasks[0].timeRemainingMs / (1000 * 60),
            );
            priority = getPriorityLevel(mostUrgentTime);
          }
          const taskDetails = userTasks.map((taskInfo) => ({
            taskId: taskInfo.task._id.toString(),
            taskTitle: taskInfo.task.title,
            dueDate: taskInfo.task.dueDate,
            timeRemainingMinutes: Math.ceil(
              taskInfo.timeRemainingMs / (1000 * 60),
            ),
            todoListTitle: taskInfo.todoList.title,
          }));
          await this.sendNotificationToUser.sendNotificationToUser(
            userId,
            'task-reminder',
            {
              message,
              totalTasks: userTasks.length,
              tasks: taskDetails,
              priority,
            },
          );
          try {
            const user = await this.userModel
              .findById(userId)
              .select('email firstName lastName');
            if (user && user.email) {
              const userName = `${user.firstName} ${user.lastName}`;
              const emailSubject =
                userTasks.length === 1
                  ? '🔔 تذكير: مهمة مستحقة قريباً'
                  : `🔔 تذكير: ${userTasks.length} مهام مستحقة قريباً`;
              await this.sendEmailNotification(
                user.email,
                userName,
                emailSubject,
                message,
                taskDetails,
              );
            }
          } catch (emailError) {
            console.error(
              `❌ Error sending email for user ${userId}:`,
              emailError,
            );
          }
          for (const taskInfo of userTasks) {
            await this.cronCacheService.markAsNotified(
              taskInfo.task._id.toString(),
              'reminder',
            );
          }
        }
      } catch (error) {
        console.error('❌ Error in optimized task reminder cron job:', error);
      }
    });
    console.log('✅ Optimized task reminder cron job started successfully');
  }

  private startOptimizedOverdueTaskCron() {
    console.log(
      '🕒 Starting optimized overdue task checker cron job with Redis caching...',
    );
    nodeCron.schedule('*/30 * * * *', async () => {
      console.log('🔍 Checking for overdue tasks (with caching)...');
      try {
        const now = new Date();
        const overdueTasks = await this.cronCacheService.getOverdueTasks(now);
        const overdueTasksByUser = new Map<string, any[]>();
        for (const task of overdueTasks) {
          if (!task.toDoListId) continue;
          const todoList = task.toDoListId;
          const userId = todoList.userId.toString();
          const taskId = task._id.toString();
          const wasNotified = await this.cronCacheService.wasRecentlyNotified(
            taskId,
            'overdue',
            60,
          );
          if (wasNotified) continue;
          if (!overdueTasksByUser.has(userId))
            overdueTasksByUser.set(userId, []);
          const overdueMs = now.getTime() - new Date(task.dueDate).getTime();
          const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
          const overdueMinutes = Math.floor(
            (overdueMs % (1000 * 60 * 60)) / (1000 * 60),
          );
          overdueTasksByUser.get(userId)?.push({
            task,
            todoList,
            overdueMs,
            overdueHours,
            overdueMinutes,
          });
        }
        for (const [userId, userTasks] of overdueTasksByUser) {
          userTasks.sort((a, b) => b.overdueMs - a.overdueMs);
          let overdueMessage: string;
          if (userTasks.length === 1) {
            const taskInfo = userTasks[0];
            const overdueTimeString = formatOverdueTime(
              taskInfo.overdueHours,
              taskInfo.overdueMinutes,
            );
            overdueMessage = `🔴 مهمة متأخرة: "${taskInfo.task.title}" تأخرت ${overdueTimeString}`;
          } else {
            const taskTitles = userTasks
              .slice(0, 3)
              .map((taskInfo) => {
                const overdueTimeString = formatOverdueTime(
                  taskInfo.overdueHours,
                  taskInfo.overdueMinutes,
                );
                return `"${taskInfo.task.title}" (تأخرت ${overdueTimeString})`;
              })
              .join('، ');
            const totalTasks = userTasks.length;
            const remainingTasks =
              totalTasks > 3 ? ` و ${totalTasks - 3} مهام أخرى` : '';
            overdueMessage = `🔴 لديك ${totalTasks} مهام متأخرة: ${taskTitles}${remainingTasks}`;
          }
          const taskDetails = userTasks.map((taskInfo) => ({
            taskId: taskInfo.task._id.toString(),
            taskTitle: taskInfo.task.title,
            dueDate: taskInfo.task.dueDate,
            overdueHours: taskInfo.overdueHours,
            overdueMinutes: taskInfo.overdueMinutes,
            todoListTitle: taskInfo.todoList.title,
          }));
          await this.sendNotificationToUser.sendNotificationToUser(
            userId,
            'task-overdue',
            {
              message: overdueMessage,
              totalTasks: userTasks.length,
              tasks: taskDetails,
              priority: 'critical',
            },
          );
          try {
            const user = await this.userModel
              .findById(userId)
              .select('email firstName lastName');
            if (user && user.email) {
              const userName = `${user.firstName} ${user.lastName}`;
              const emailSubject =
                userTasks.length === 1
                  ? '🔴 تنبيه: مهمة متأخرة'
                  : `🔴 تنبيه: ${userTasks.length} مهام متأخرة`;
              await this.sendEmailNotification(
                user.email,
                userName,
                emailSubject,
                overdueMessage,
                taskDetails,
              );
            }
          } catch (emailError) {
            console.error(
              `❌ Error sending overdue email for user ${userId}:`,
              emailError,
            );
          }
          for (const taskInfo of userTasks) {
            await this.cronCacheService.markAsNotified(
              taskInfo.task._id.toString(),
              'overdue',
            );
          }
        }
      } catch (error) {
        console.error('❌ Error in optimized overdue task cron job:', error);
      }
    });
    console.log('✅ Optimized overdue task cron job started successfully');
  }

  private startCacheCleanupCron() {
    nodeCron.schedule('0 * * * *', async () => {
      await this.cronCacheService.cleanupOldCache();
    });
  }
}
