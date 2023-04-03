import { TMergeRequestAttrs } from '../@types/type.js';
import { accessKeyId, accessKeySecret, organizationId } from '../config/index.js';
import { logger } from './log.js';
import ROA from '@alicloud/pop-core';

// @ts-ignore
const ROAClient = ROA.ROAClient;

export interface IMergeRequestOptions {
  FromCommit: string;
  ToCommit: string;
}

/*
[
  {
    IsDraft: false,
    Path: 'package.json',
    CreatedAt: '2023-03-29T09:50:47+08:00',
    ProjectId: 3292065,
    UpdatedAt: '2023-03-29T09:50:47+08:00',
    Line: 10,
    Side: 'right',
    Closed: 0,
    Note: '## 代码审查\n',
    Author: [{
      AvatarUrl: 'https://tcs-devops.aliyuncs.com/thumbnail/1123ead14445a6c3e70ad586579abd52b109/w/100/h/100',
      Id: 164544,
      Name: 'xxx'
    }],
    Id: 12041628,
    OutDated: false,
    RangeContext: 'f0ccf901f509bef3673c2ea482c46a4fdb433f3a 638eada644cf32ac637f399cd34dd71726af0aaf'
  }
]
*/
/** 历史评论信息 */
 export interface INote {
  IsDraft: boolean;
  Path: string;
  CreatedAt: string;
  ProjectId: number;
  UpdatedAt: string;
  Line: number;
  Side: string;
  Closed: number;
  Note: string;
  Author: {
    AvatarUrl: string;
    Id: number;
    Name: string;
  }[];
  Id: number;
  OutDated: boolean;
  RangeContext: string;
}

export class RoaComment {
  #roa: any;
  #params: TMergeRequestAttrs;
  #commentMap: Record<string, INote> = {};
  constructor(opts: TMergeRequestAttrs) {
    this.#roa = new ROAClient({
      accessKeyId,
      accessKeySecret,
      endpoint: 'https://codeup.cn-hangzhou.aliyuncs.com',
      apiVersion: '2020-04-14'
    });
    this.#params = opts;
  }
  /** roa请求 */
  async request<T>(
    method: 'POST' | 'GET',
    url: string,
    query?: Record<string, any>,
    body?: Record<string, any>,
    headers?: Record<string, any>
  ) {
    const res = await this.#roa.request(method, url, query, JSON.stringify(body || {}), {
      'Content-Type': 'application/json',
      ...(headers || {})
    });

    if (res.Success) {
      return res.Result as T;
    }
    logger.error(JSON.stringify(res), { type: 'roa-request' });
    new Error(JSON.stringify(res));
    return null;
  }
  /** 获取合并请求评论列表 */
  async getMergeRequestComments() {
    const { source_project_id, id, target_branch, source_branch } = this.#params;
    const url = `/api/v4/projects/${source_project_id}/merge_request/${id}/comments`;
    const list = await this.request<INote[]>('GET', url, {
      OrganizationId: organizationId,
      RegionId: 'cn-hangzhou',
      FromCommit: target_branch,
      ToCommit: source_branch,
      ProjectId: source_project_id,
      MergeRequestId: id
    });

    list?.map(item => {
      this.#commentMap[item.Path] = item;
    });

    return list;
  }
  /** 提交合并请求评论 */
  async submitMergeRequestComment(body: any) {
    const { source_project_id, id } = this.#params;
    const url = `/api/v4/projects/${source_project_id}/merge_request/${id}/comments`;
    return await this.request(
      'POST',
      url,
      { OrganizationId: organizationId, RegionId: 'cn-hangzhou' },
      {
        is_draft: false,
        side: 'right',
        ...body
      }
    );
  }
  /** 判断行是否已经存在评论, 有则不再评论, 无则评论. 如果行存在评论申请合并之后 push 将不会评论 */
  lineIsComment(path?: string, line?: number) {
    if (!path) return false;
    if (isNaN(Number(line))) return false;

    const targetComment = this.#commentMap[path];

    let isComment = false;
    // 文件相同并且行相同
    if (path === targetComment?.Path && line === targetComment?.Line) {
      isComment = true;
    }

    return isComment;
  }
  /** 更新行评论状态 */
  updateLineCommentState(path?: string, line?: number) {
    if (!path) return ;
    if (isNaN(Number(line))) return ;

    if (!this.#commentMap[path]) {
      this.#commentMap[path] = {
        Path: path,
        Line: line!
      } as any;
    }
  }
}
