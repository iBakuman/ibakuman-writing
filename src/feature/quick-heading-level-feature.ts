import { window, Position, ExtensionContext, commands, Range, Selection } from 'vscode';

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        commands.registerCommand('markdown.extension.heading.toggleLevel1', () => toggleHeadingLevel(HeadingLevel.LEVEL1)),
        commands.registerCommand('markdown.extension.heading.toggleLevel2', () => toggleHeadingLevel(HeadingLevel.LEVEL2)),
        commands.registerCommand('markdown.extension.heading.toggleLevel3', () => toggleHeadingLevel(HeadingLevel.LEVEL3)),
        commands.registerCommand('markdown.extension.heading.toggleLevel4', () => toggleHeadingLevel(HeadingLevel.LEVEL4)),
        commands.registerCommand('markdown.extension.heading.toggleLevel5', () => toggleHeadingLevel(HeadingLevel.LEVEL5)),
        commands.registerCommand('markdown.extension.heading.toggleLevel6', () => toggleHeadingLevel(HeadingLevel.LEVEL6)),
    );
}

// 标题等级枚举类
enum HeadingLevel {
    LEVEL1 = '#',
    LEVEL2 = '##',
    LEVEL3 = '###',
    LEVEL4 = '####',
    LEVEL5 = '#####',
    LEVEL6 = '######',
}
async function toggleHeadingLevel(level: HeadingLevel) {
    const editor = window.activeTextEditor!;
    // 获得当前鼠标光标所在行号
    // Get the line number of the current mouse cursor.
    const lineIndex = editor.selection.active.line;
    // 获取当前行的内容
    // Get the contents of the current row.
    let lineText = editor.document.lineAt(lineIndex).text;

    // heading regex
    const headingRegex = /(^#+)\s*(.*)/g;
    const match = headingRegex.exec(lineText);
    let repl = level + ' ' + lineText;
    if (match) {
        const headingLevelStr = match[1];
        // 如果当前行已经是指定的标题等级则取消标题等级，否则将当前行设置为指定的标题等级
        // Uncheck the heading level if the current row already has the specified title level,
        // otherwise set the current row to the specified heading level
        if (headingLevelStr != level) {
            repl = level + ' ' + match[2];
        } else {
            repl = match[2];
        }
    }

    return await editor.edit((editBuilder) => {
        editBuilder.replace(
            new Range(new Position(lineIndex, 0), new Position(lineIndex, lineText.length)),
            repl);
    }).then(() => {
        editor.selection = new Selection(
            new Position(lineIndex, repl.length),
            new Position(lineIndex, repl.length));
    })
}
