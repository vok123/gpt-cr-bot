/*
 {
  "object_kind": "merge_request",
  "user": {
    "name": "Codeup",
    "username": "codeup",
    "avatar_url": ""
  },
  "object_attributes": {
    "id": 99,
    "target_branch": "master",
    "source_branch": "ms-viewport",
    "source_project_id": 14,
    "author_id": 51,
    "assignee_id": 6,
    "title": "MS-Viewport",
    "created_at": "2019-09-03T17:23:00Z",
    "updated_at": "2019-09-03T17:23:00Z",
    "st_commits": null,
    "st_diffs": null,
    "milestone_id": null,
    "state": "opened",
    "merge_status": "unchecked",
    "target_project_id": 14,
    "iid": 1,
    "description": "",
    "source": {
      "name": "demo",
      "ssh_url": "git@codeup.aliyun.com:demo/demo.git",
      "http_url": "https://codeup.aliyun.com/demo/demo.git",
      "web_url": "https://codeup.aliyun.com/demo/demo",
      "namespace": "demo",
      "visibility_level": 10
    },
    "target": {
      "name": "demo",
      "ssh_url": "git@codeup.aliyun.com:demo/demo.git",
      "http_url": "https://codeup.aliyun.com/demo/demo.git",
      "web_url": "https://codeup.aliyun.com/demo/demo",
      "namespace": "demo",
      "visibility_level": 10
    },
    "last_commit": {
      "id": "da1560886d4f094c3e6c9ef40349f7d38b5d27d7",
      "message": "fixed readme",
      "timestamp": "2019-02-03T23:36:29+02:00",
      "url": "https://codeup.aliyun.com/demo/demo/commits/da1560886d4f094c3e6c9ef40349f7d38b5d27d7",
      "author": {
        "name": "Codeup",
        "email": "codeup@aliyun.com"
      }
    },
    "work_in_progress": false,
    "url": "https://codeup.aliyun.com/demo/demo/merge_requests/1",
    "action": "open"
  }
}
 */
export interface IMergeRequest {
  object_attributes: {
    work_in_progress: boolean;
    last_commit: {
      author: {
        name: string;
        email: string;
      };
      id: string;
      message: string;
      url: string;
      timestamp: string;
    };
    iid: number;
    created_at: string;
    description: string;
    /** 目标分支 */
    target_branch: string;
    source: {
      web_url: string;
      name: string;
      namespace: string;
      ssh_url: string;
      visibility_level: number;
      http_url: string;
    };
    /** 仓库ID or 项目ID */
    source_project_id: number;
    title: string;
    is_use_push_block: boolean;
    url: string;
    /** 当前分支 */
    source_branch: string;
    target: {
      web_url: string;
      name: string;
      namespace: string;
      ssh_url: string;
      visibility_level: number;
      http_url: string;
    };
    updated_at: string;
    merge_status: string;
    action: string;
    /** 合并请求ID */
    id: number;
    state: string;
    author_id: number;
    target_project_id: number;
    is_update_by_push: boolean;
  };
  repository: {
    secondary_url: string;
    name: string;
    git_http_url: string;
    git_ssh_url: string;
    url: string;
    homepage: string;
  };
  user: {
    avatar_url: string;
    name: string;
    aliyun_pk: string;
    extern_uid: string;
    username: string;
  };
  object_kind: 'push' | 'tag_push' | 'note' | 'merge_request';
}

export type TMergeRequestAttrs = IMergeRequest['object_attributes'];