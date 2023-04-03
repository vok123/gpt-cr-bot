import express from 'express';
import bodyParser from 'body-parser';
import { Client } from './utils/client.js';
import { IMergeRequest } from './@types/type.js';
import { RoaComment } from './utils/comment.js';
import { ChatGpt } from './utils/chat.js';
import { getCodeUpDiffInfo } from './utils/get-diff-info.js';
import { logger, readLog } from './utils/log.js';

const jsonParser = bodyParser.json();
const app = express();
const port = 80;

app.post('/cr-bot/webhook', jsonParser, async (req, res) => {
  try {
    const data = req.body as IMergeRequest;
    const { action, source_branch, last_commit } = data.object_attributes;

    if (data.object_kind !== 'merge_request') {
      return res.end();
    }
    if (['reopen', 'open', 'update'].every((state) => action !== state)) {
      return res.end();
    }
    logger.info(JSON.stringify(data), { type: 'merge-info' });
    const commentManager = new RoaComment(data.object_attributes);

    const client = new Client(data.object_attributes);

    // doc https://help.aliyun.com/document_detail/477377.html
    const compareDetail = await client.getCompareDetail();

    if (!compareDetail) {
      logger.error(data.repository.url, { type: 'compareDetail-error' });
      return res.end();
    }
    // 获取评论列表
    await commentManager.getMergeRequestComments();
    // 获取忽略review的文件列表
    await client.getFileBlobs('.cr-ignore');

    const comments = compareDetail.commits || [];
    const lastCommitId = comments[comments.length - 1].id;
    const firstCommitId = comments[0].id;

    const chatGPT = new ChatGpt();

    for (let item of compareDetail?.diffs || []) {
      if (item.deletedFile || item.isBinary || item.renamedFile || item.isNewLfs || String(item.bMode) === '100755') {
        continue;
      }
      // 文件是否忽略review
      if (client.isIgnoreFile(item.newPath)) {
        logger.info(item.newPath!, { type: 'isIgnoreFile' });
        continue;
      }
      const diffLines = getCodeUpDiffInfo(item.diff!);

      for (const diff of diffLines) {
        // 是否已经评论
        if (commentManager.lineIsComment(item.newPath, diff.line)) {
          logger.info(item.newPath! + ':' + diff.line, { type: 'lineIsComment' });
          continue;
        }
        logger.info(item.newPath! + ':' + diff.line, { type: 'reviewing' });
        // chatgpt review结果
        const note = await chatGPT.sendCodeDiff(item.newPath!, diff.content);

        if (note) {
          logger.info(JSON.stringify({ file: item.newPath! + ':' + diff.line, note }), { type: 'review-complete' });
          // 提交codeup评论
          await commentManager.submitMergeRequestComment({
            note: `${item.newPath}\n${note}`,
            line: diff.line,
            commit_id: lastCommitId,
            comparison_commit_id: firstCommitId,
            path: item.newPath
          });

          commentManager.updateLineCommentState(item.newPath, diff.line);
          // 获取评论列表
          await commentManager.getMergeRequestComments();
        }
      }
    }
    logger.info(JSON.stringify({
      msg: `完成代码审查`,
      source_branch,
      repository: data.repository.url,
      time: Date.now(),
      action,
      last_commit
    }), { type: 'review-success' });
  } catch (err: any) {
    console.log(err);
    logger.error(JSON.stringify(err), { type: 'catch-error' });
  } finally {
    return res.end();
  }
});

app.get('/cr-bot/logs', async (req, res) => {
  const { date, startTime, endTime, level } = req.query;
  const list = readLog({ date, startTime, endTime, level } as any);
  res.json({
    code: 0,
    data: list,
    msg: ''
  });
});

app.get('/cr-bot/hello', (req, res) => {
  return res.end('Hello!');
});

app.listen(port, async () => {
  console.log('Listening at http://localhost:' + port);
});
