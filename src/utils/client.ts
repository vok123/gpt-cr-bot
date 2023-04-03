import { accessKeyId, accessKeySecret, organizationId } from '../config/index.js';
import devops20210625 from '@alicloud/devops20210625';
import * as OpenApi from '@alicloud/openapi-client';
import minimatch from 'minimatch';
import { TMergeRequestAttrs } from '../@types/type.js';
import { logger } from './log.js';

type TDevops20210625 = devops20210625.default;

export class Client {
  #client: TDevops20210625;
  #params: TMergeRequestAttrs;
  #ignoreFiles: string[] = ['.cr-ignore*', 'pnpm-lock*', 'package-lock*', '*/locales/*.json', 'dist/*'];

  constructor(opts: TMergeRequestAttrs) {
    this.#params = opts;
    let config = new OpenApi.Config({
      // 必填，您的 AccessKey ID
      accessKeyId,
      // 必填，您的 AccessKey Secret
      accessKeySecret
    });
    // 访问的域名
    config.endpoint = `devops.cn-hangzhou.aliyuncs.com`;
    this.#client = new devops20210625.default(config);
  }
  /** 获取diff结果 */
  async getCompareDetail() {
    const { source_project_id, target_branch, source_branch } = this.#params;
    const res = await this.#client.getCompareDetail(String(source_project_id), {
      organizationId,
      mergeBase: true,
      from: target_branch,
      to: source_branch
    } as any);
    if (res.body.success) {
      return res.body.result!;
    } else {
      logger.error(JSON.stringify(res.body), { type: 'getCompareDetail' });
      return null;
    }
  }
  /** 读取仓库文件 */
  async getFileBlobs(filePath: string) {
    const { source_project_id: repositoryId, source_branch } = this.#params;
    try {
      const res = await this.#client.getFileBlobs(String(repositoryId), {
        repositoryId,
        organizationId,
        filePath,
        ref: source_branch
      } as any);
      if (res.body.success) {
        const list = (res.body.result?.content || '')
          .split('\n')
          .filter(Boolean)
          .map((item) => item.trim());
        this.#ignoreFiles.push(...list);
        return res.body.result!;
      } else {
        logger.warn(JSON.stringify(res.body), { type: 'getFileBlobs', msg: '获取出错:' + filePath });
        return '';
      }
    } catch (err) {
      logger.warn(JSON.stringify(err), { type: 'catch-getFileBlobs', msg: '没找到文件:' + filePath });
      return '';
    }
  }
  /** 查询是否文件是否被忽略 */
  isIgnoreFile(path?: string) {
    if (!path) return true;
    return this.#ignoreFiles.some((p) => minimatch(path, p));
  }
}
