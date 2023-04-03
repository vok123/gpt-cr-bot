import gitDiffParser, { InsertChange } from 'gitdiff-parser';

gitDiffParser.default = {
  parse: (gitDiffParser as any).parse
}

export const getCodeUpDiffInfo = (diff: string) => {
  // 补齐git diff内容, 否则无法parse出正确结果
  const text = `diff --git a/test.json b/test.json
index cb2f4bc..35455a2 100644
${diff}
`;
  return gitDiffInfo(text);
};

export const gitDiffInfo = (diff: string) => {
  const parseResult = gitDiffParser.default.parse(diff);
  const diffLines = [] as Array<{ line: number; content: string }>;
  parseResult.map(item => {
    item.hunks.map(item => {
      const newContentLastIndex = item.changes.reduce((lastIndex, item, index) => {
        if (item.type === 'insert') {
          lastIndex = index;
        }
        return lastIndex;
      }, -1);
      const hasNewContent = newContentLastIndex > -1;
      if (hasNewContent) {
        const changeInfo = item.changes[newContentLastIndex] as InsertChange;
        const content = item.changes.reduce((txt, change) => {
          const typeChar = change.type === 'delete' ? '-' : (change.type === 'insert') ? '+' : '';
          txt += typeChar + change.content + '\n';
          return txt;
        }, '');

        diffLines.push({ line: changeInfo.lineNumber, content });
      }
    });
  });
  return diffLines;
};
