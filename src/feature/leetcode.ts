import { commands, env, ExtensionContext, Position, Range, Selection, TextDocument, TextEditor, window, workspace, WorkspaceEdit } from 'vscode';


export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        commands.registerCommand('markdown.extension.leetcode.formatProblem', () => formatProblem())
    )
}

async function formatProblem() {
    const editor = window.activeTextEditor
    if (!editor) {
        return
    }

    await formatExample(editor)
    await formatTips(editor)
    // download images
    commands.executeCommand('markdown.extension.downloadAllImage')
}

// format the example section
async function formatExample(editor: TextEditor) {
    const doc = editor.document
    for (let lineNum = 0; lineNum < doc.lineCount; lineNum++) {
        let curLineText = doc.lineAt(lineNum).text
        if (curLineText.startsWith('## 解法一')) {
            return
        }
        if (curLineText.startsWith('**输入') || curLineText.startsWith('**输出') || curLineText.startsWith('**解释')) {
            curLineText = curLineText.replace(/\*\*/g, "")
            curLineText = '- ' + curLineText
            await editor.edit((editBuilder) => {
                editBuilder.replace(doc.lineAt(lineNum).range, curLineText)
            })
        }
    }
}

async function formatTips(editor: TextEditor) {
    const doc = editor.document
    let lineNum = 0
    while (lineNum < doc.lineCount) {
        let curLineText = doc.lineAt(lineNum).text
        if (curLineText.startsWith('**提示')) {
            while (lineNum < doc.lineCount) {
                curLineText = doc.lineAt(lineNum).text
                if (curLineText.includes("<sup>") || curLineText.includes("<sub>")) {
                    curLineText = curLineText.replace(/`/g, "")
                    await editor.edit((editBuilder) => {
                        editBuilder.replace(doc.lineAt(lineNum).range, curLineText)
                    })
                }
                lineNum++
            }
            return
        }
        lineNum++
    }
}
