import { logger } from './log.js';
import { reverseProxyUrl, openaiApiKey } from '../config/index.js';
// @ts-ignore
import chatGptClient from '@waylaidwanderer/chatgpt-api';
import { KeyvFile } from 'keyv-file';

interface IReviewItem {
  path: string;
  diff: string;
  reviewState?: 'requesting' | 'complete' | 'error';
}

export class ChatGpt {
  reviewedFiles: IReviewItem[] = [];

  async sendCodeDiff(path: string, diff: string) {
    if (!path || !diff) return '';

    let target = this.reviewedFiles.find((item) => item.path === path && item.diff === diff);

    if (['requesting', 'complete'].includes(target?.reviewState!)) return '';

    if (!target) {
      this.reviewedFiles.push((target = { path, diff, reviewState: 'requesting' }));
    }

    const systemPrompt = `接下来你将会对一段git diff结果的代码补丁进行审查, 以下是用户期望的要求:
    要求1: 请使用中文进行检查潜在的风险
    要求2: 回复时尽量使用 markdown 语法
    要求3: 回复时只需简要报告风险项和风险等级即可
    要求4: 如果代码有优化空间请帮忙提供简要修改建议
    `;

    try {
      const note = await this.sendMessage(diff, systemPrompt);
      target.reviewState = 'complete';

      return note;
    } catch (err) {
      target.reviewState = 'error';
      logger.error(JSON.stringify(err), { type: 'chat-gpt-sendCodeDiff' });
      return '';
    }
  }

  async sendMessage(message: string, promptPrefix?: string) {
    const client = new chatGptClient(
      openaiApiKey,
      {
        reverseProxyUrl: reverseProxyUrl,
        promptPrefix,
        modelOptions: {
          model: 'gpt-3.5-turbo-0301',
          stream: false,
          max_tokens: 1000,
          temperature: 0.8,
          top_p: 1
        }
      },
      {
        store: new KeyvFile({ filename: 'cache.json' })
      }
    );

    const res = await client.sendMessage(message, { promptPrefix });

    return res.response;
  }
}
