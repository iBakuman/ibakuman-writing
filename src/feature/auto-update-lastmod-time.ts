import { TextEditor, Position, TextDocument } from 'vscode';
import { TextDocumentWillSaveEvent } from 'vscode';
import { WorkspaceEdit } from 'vscode';
import { window } from 'vscode';
import { ExtensionContext, commands, workspace } from 'vscode';

export function activate(context: ExtensionContext) {
    // "key": "alt+b"
    // "when": "editorHasSelection && editorLangId =~ /^markdown$|^rmd$|^quarto$/"
    context.subscriptions.push(
        commands.registerCommand('markdown.extension.autoUpdateLastModifiedTime', () => updateLastModifiedTime()),
    )
    const enabled = workspace.getConfiguration('markdown.extension.autoUpdateLastModifiedTime').get<boolean>('enable')!;
    if (enabled) {
        workspace.onWillSaveTextDocument((event) => {
            updateLastModifiedTimeOnSave(event)
        })
    }
}

const DATE_TIME_FORMAT:Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Shanghai'
};

const LOCALS = 'zh-CN'

function updateLastModifiedTimeOnSave(event: TextDocumentWillSaveEvent) {
    const doc = event.document
    if (doc.languageId !== 'markdown') {
        return
    }
    const edit = new WorkspaceEdit()
    const filedName = workspace.getConfiguration('markdown.extension.autoUpdateLastModifiedTime').get<string>('fieldName')!;
    // hasFM represents whether the current markdown file has front matter.
    // FMMaxLineNum represents the last line number of front matter.
    const { hasFM, FMMaxLineNum, dateIdx, lastModIdx } = hasLastmodField(doc, filedName)
    if (hasFM) {
        const currentTime = new Date().toLocaleString(LOCALS, DATE_TIME_FORMAT)
        const newLastModifiedTime = `${filedName}: ${currentTime}`
        // The 'lastMod' field already exists, update its value to current date time.
        if (lastModIdx !== -1) {
            edit.replace(doc.uri, doc.lineAt(lastModIdx).range, newLastModifiedTime)
        } else {// Insert lastMod field to front matter
            if (dateIdx !== -1 && dateIdx !== FMMaxLineNum) {// Insert the lastMod field below the date field
                edit.insert(doc.uri, doc.lineAt(dateIdx).range.start.translate(1, 0), newLastModifiedTime + '\n')
            } else {// Insert the lastMod field before the last line of front matter
                edit.insert(doc.uri, doc.lineAt(FMMaxLineNum).range.start.translate(1, 0), newLastModifiedTime + '\n')
            }
        }
    }
    event.waitUntil(workspace.applyEdit(edit))
}

function updateLastModifiedTime() {
    const editor = window.activeTextEditor;
    if (!editor) {
        window.showErrorMessage('No active editor found!')
        return
    }

    const doc = editor.document

    if (doc.languageId !== 'markdown') {
        window.showInformationMessage('This command is only supported for Markdown file.')
        return
    }

    const filedName = workspace.getConfiguration('markdown.extension.autoUpdateLastModifiedTime').get<string>('fieldName')!;
    // hasFM represents whether the current markdown file has front matter.
    // FMMaxLineNum represents the last line number of front matter.
    const { hasFM, FMMaxLineNum, dateIdx, lastModIdx } = hasLastmodField(doc, filedName)
    if (hasFM) {
        const currentTime = new Date().toLocaleString(LOCALS, DATE_TIME_FORMAT)
        const newLastModifiedTime = `${filedName}: ${currentTime}`
        // The 'lastMod' field already exists, update its value to current date time.
        if (lastModIdx !== -1) {
            editor.edit((editBuilder) => {
                editBuilder.replace(doc.lineAt(lastModIdx).range, newLastModifiedTime)
            })
        } else {// Insert lastMod field to front matter
            if (dateIdx !== -1 && dateIdx !== FMMaxLineNum) {// Insert the lastMod field below the date field
                editor.edit((editBuilder) => {
                    editBuilder.insert(doc.lineAt(dateIdx).range.start.translate(1, 0), newLastModifiedTime + '\n')
                })
            } else {// Insert the lastMod field before the last line of front matter
                editor.edit((editBuilder) => {
                    editBuilder.insert(doc.lineAt(FMMaxLineNum).range.start.translate(1, 0), newLastModifiedTime + '\n')
                })
            }
        }
    }
}

function hasLastmodField(doc: TextDocument, fieldName: string): { hasFM: boolean; FMMaxLineNum: number, dateIdx: number; lastModIdx: number } {
    let res = { hasFM: false, FMMaxLineNum: -1, dateIdx: -1, lastModIdx: -1 }
    if (!doc) {
        return res
    }
    if (doc.lineCount < 1 || !doc.lineAt(0).text.startsWith('---')) {
        return res
    }
    for (let lineNum = 1; lineNum < doc.lineCount; lineNum++) {
        const line = doc.lineAt(lineNum)
        if (line.text.startsWith('---')) {
            res.hasFM = true
            res.FMMaxLineNum = lineNum - 1
            break
        }
        else if (line.text.startsWith('date:')) {
            res.dateIdx = lineNum
        } else if (line.text.startsWith(`${fieldName}:`)) {
            res.lastModIdx = lineNum
        }
    }
    return res
}

