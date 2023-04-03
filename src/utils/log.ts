import { format, createLogger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { combine, printf } = format;

export interface IReadParams {
  date: string;
  startTime: string;
  endTime: string;
  level: string;
}

export interface ILogItem {
  timestamp: string;
  level: string;
  message: string;
  type: string;
}

const dailyRotateFile = new DailyRotateFile({
  filename: '../logs/%DATE%.log',// path.join(__dirname, '..', 'logs', `%DATE%.log`),
  datePattern: 'YYYY-MM-DD'
});

const customFormat = printf(({ level, message, type = '' }) => {
  return JSON.stringify({
    timestamp: new Date(),
    level,
    message,
    type
  });
});

export const logger = createLogger({
  format: combine(customFormat),
  transports: [dailyRotateFile]
});

export const readLog = ({ date, startTime, endTime, level }: IReadParams): ILogItem[] => {
  const day = dayjs(date).format('YYYY-MM-DD');
  const fileName = day + '.log';
  const filePath = path.join(__dirname, '..', 'logs', fileName);
  if (fs.existsSync(filePath) === false) {
    return [];
  }

  const content: string = fs.readFileSync(filePath, { encoding: 'utf-8' });
  let list = content.split('\n').filter(Boolean).map(item => {
    return JSON.parse(item) as ILogItem;
  });

  if (level) {
    list = list.filter(item => item.level === level);
  }

  if (startTime) {
    list = list.filter(item => dayjs(item.timestamp).isSameOrAfter(dayjs(`${day} ${startTime}`)));
  }

  if (endTime) {
    list = list.filter(item => dayjs(item.timestamp).isSameOrBefore(dayjs(`${day} ${endTime}`)));
  }

  return list;
};

export const readFileList = () => {
  const files = fs.readdirSync(path.join(__dirname, '..', 'logs'));
  return files.map(item => item.split('.')[0]);
};
