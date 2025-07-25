import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodeCron from 'node-cron';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
@Injectable()
export class KeepAliveCronService implements OnModuleInit {
  onModuleInit() {
    this.startPingCron();
  }

  private startPingCron() {
    nodeCron.schedule('*/10 * * * *', async () => {
      console.log('🔄 Running ping cron job to keep server alive');
      try {
        const response = await axios.get(`${process.env.BACKEND_URL}/api/ping`);
        console.log('✅ Server is alive:', response.data);
      } catch (error) {
        console.error('❌ Error pinging server:', error.message);
      }
    });
    console.log('✅ Keep-alive ping cron job started');
  }
}
