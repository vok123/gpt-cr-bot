# 阿里 codeup 代码code review
利用codeup webhook 获取到合并请求内容并发送到chatgpt完成代码审查, 并将审查结果通过codeup api 提交评论至修改行

## 开始
### 1. codeup 配置 src/config/index.ts
``` ts
/** 企业标识id */
export const organizationId = '企业标识id';

// 如何获取 accessKey: https://help.aliyun.com/document_detail/116401.htm?spm=a2c4g.11186623.0.0.1e88445cGkszzk
export const accessKeyId = 'accessKeyId';
export const accessKeySecret = 'accessKeySecret';
/** 定义chatgpt Api服务完整地址, 默认直接调用官方api(国内网络需要科学上网) */
export const reverseProxyUrl = '';
/** gpt api key */
export const openaiApiKey = '';
```

### 2. 设置忽略code review文件或者目录
- 在项目中根目录新建 `.cr-ignore` 文件
- 输入需要忽略的文件

例子:
```txt
*/locales/*.json
dist/*
package.json
```
更多规则可参考[https://github.com/isaacs/minimatch](https://github.com/isaacs/minimatch)

### 3. 启动服务
- `npm i`
- `npm run dev` or `npm run start`

### 4. codeup 开启推送评审模式

仓库 -> 设置 -> 推送规则设置 -> 推送评审模式[打开]

### 5.项目仓库配置
- 进入仓库 -> 设置 -> Webhooks -> 新建Webhook
- URL中填入 `${domain}/cr-bot/webhook`
- 触发器只选择`合并请求事件`
- 确定

### 6. 最后一步, 往目标分支推送代码
`开启推送评审模式` 后codeup将会创建临时的代码合并分支, 并为该临时分支创建一个合并到目标分支的合并请求
