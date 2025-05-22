import * as monaco from 'monaco-editor';
import * as ts from 'typescript';

function parseCode(code: monaco.editor.IMarkerData['code']): string {
  if (code === undefined) {
    return '';
  } else if (typeof code === 'string') {
    return code;
  } else {
    return code.value;
  }
}

function findOnUISetupPosition(model: monaco.editor.ITextModel): number {
  const text = model.getValue();
  const fileName = model.uri.toString();

  const sourceFile = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  let position = -1;

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'onUISetup') {
      position = model.getPositionAt(node.getStart()).lineNumber;
    }
  });

  return position;
}

function findLastNonEmptyLine(model: monaco.editor.ITextModel): number {
  let n = model.getLineCount();

  for (; n >= 1 && model.getLineContent(n).length === 0; --n);

  return n;
}

monaco.languages.registerCodeActionProvider('typescript', {
  provideCodeActions(model, _range, context, _token) {
    const codePrefix = 'requireBtnOnClick_';
    const actions: monaco.languages.CodeAction[] = [];

    for (const marker of context.markers) {
      const code = parseCode(marker.code);
      if (code.startsWith(codePrefix)) {
        const fnName = code.slice(codePrefix.length);

        let insertLine = findOnUISetupPosition(model);

        const eol = model.getEOL();

        let extraEOLStart = '';
        let extraEOLEnd = '';
        if (insertLine === -1) {
          insertLine = findLastNonEmptyLine(model) + 1;

          if (model.getLineContent(insertLine - 1).length > 0) {
            extraEOLStart = eol.repeat(insertLine <= model.getLineCount() ? 1 : 2);
          }
        } else {
          if (model.getLineContent(insertLine - 1).length > 0) {
            extraEOLStart = eol;
          }

          extraEOLEnd = eol;
        }

        actions.push({
          title: `Add missing function declaration '${fnName}'`,
          diagnostics: [marker],
          kind: 'quickfix',
          edit: {
            edits: [
              {
                resource: model.uri,
                textEdit: {
                  range: new monaco.Range(insertLine, 1, insertLine, 1),
                  text: `${extraEOLStart}async function ${fnName}(input: UIInput, api: API): Promise<void> {${eol} // TODO: implement${eol}}${eol}${extraEOLEnd}`,
                },
                versionId: model.getVersionId(),
              },
            ],
          },
          isPreferred: true,
        });
      }
    }

    return {
      actions,
      dispose: () => {},
    };
  },
});
