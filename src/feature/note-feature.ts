import { commands, env, ExtensionContext, Position, Range, Selection, TextDocument, window, workspace, WorkspaceEdit } from 'vscode';
import { configManager } from '../configuration/manager';
import path = require('path');

export function activate(context: ExtensionContext) {
    // "key": "alt+b"
    // "when": "editorHasSelection && editorLangId =~ /^markdown$|^rmd$|^quarto$/"
    context.subscriptions.push(
        commands.registerCommand('markdown.extension.note.highlight', () => highlightSelectedTxt()),
        commands.registerCommand('markdown.extension.note.addTranslation', () => addTranslation()),
        commands.registerCommand('markdown.extension.note.addTranslationToMD', () => addTranslationToMD())
    )
}

function highlightSelectedTxt() {
    const editor = window.activeTextEditor!;
    const selection = editor.selection;
    const curCursorPos = editor.selection.active;
    const className = configManager.get("note.highlightClass");
    const openTag = `<span class="${className}">`;
    const closeTag = `</span>`;

    let repl = ''
    let replRange: Range;
    // The selected area after the command is executed.
    // NOTE: It represents the position of the cursor when there is no selection area.
    let newSelection: Selection;
    if (selection.isEmpty) {
        const regex = new RegExp(`${openTag}(.*?)${closeTag}`);
        const curLineTxt = editor.document.lineAt(curCursorPos.line).text;
        const match = curLineTxt.match(regex);
        if (match !== null) {
            // take away highlight style
            repl = match[1];
            replRange = new Range(
                curCursorPos.line, match.index!,
                curCursorPos.line, match.index! + match[0].length);

            let nextCursorPos: Position;
            if (curCursorPos.character - match.index! >= openTag.length) {
                // `<span class="..."">te|xt</span>` ---> `te|xt`
                nextCursorPos = curCursorPos.translate(0, -openTag.length);
            } else {
                // `<spa|n class="...">te|xt</spa|n>` ---> `|text`
                nextCursorPos = curCursorPos.with({ character: match.index! });
            }

            newSelection = new Selection(nextCursorPos, nextCursorPos);
        } else {
            // quick styling, wrap cursor
            // `|` ---> `<span class="...">|</span>`
            repl = `<span class="${className}"></span>`;
            replRange = selection;
            const nextCursorPos = curCursorPos.translate(0, openTag.length);
            newSelection = new Selection(nextCursorPos, nextCursorPos);
        }
    } else {
        // Highlight the selected text
        const selectedTxt = editor.document.getText(editor.selection);
        repl = `${openTag}${selectedTxt}${closeTag}`;
        replRange = selection;
        newSelection = new Selection(selection.start.translate(0, openTag.length), selection.end.translate(0, openTag.length));
    }
    return editor.edit((editBuilder) => {
        editBuilder.replace(replRange, repl);
    }).then(() => {
        // Fix cursor position
        editor.selection = newSelection;
    })
}

async function addTranslation() {
    const editor = window.activeTextEditor!;
    const selection = editor.selection;
    if (selection.isEmpty) {
        return;
    }
    const translation = await env.clipboard.readText();
    const className = configManager.get("note.translationClass")
    const content = editor.document.getText(selection);
    const repl = `<span class="${className}">${content}<sub> { ${translation} }</sub></span>`;
    return editor.edit((editBuilder) => {
        editBuilder.replace(selection, repl);
    })
}

async function addTranslationToMD() {
    const editor = window.activeTextEditor
    if (!editor) {
        return
    }
    const selection = editor.selection
    if (selection.isEmpty) {
        return
    }
    let translationFilePath = configManager.get('note.translationFilePath')
    if (!translationFilePath.startsWith('/')) {// relative path
        if (workspace.workspaceFolders) {
            const workspacePath = workspace.workspaceFolders[0].uri.fsPath
            translationFilePath = path.join(workspacePath, translationFilePath)
        } else {
            return
        }
    }
    let targetDoc: TextDocument
    try {
        targetDoc = await workspace.openTextDocument(translationFilePath)
    } catch (error) {
        window.showErrorMessage('The translation file does not exists!')
        return
    }
    const words = editor.document.getText(selection).trim().split(" ")
    // construct translation content
    const heading = `## ${words.join(" ")}`
    const translation = await env.clipboard.readText()
    const contentToInsert = `\n${heading}\n\n${translation}`
    // insert translation to target doc
    const targetLineNum = getInsertPosition(targetDoc)
    const edit = new WorkspaceEdit()
    edit.insert(targetDoc.uri, targetDoc.lineAt(targetLineNum).range.start.translate(1, 0), contentToInsert)

    const isOk = await workspace.applyEdit(edit)
    if (!isOk) {
        window.showErrorMessage('Insert content to target doc failed!')
        return
    }

    // change the original doc to reference the translation in target doc
    let currentPath = editor.document.uri.fsPath
    if (currentPath.endsWith('.md')) {
        currentPath = path.dirname(currentPath)
    }
    let targetPath = targetDoc.uri.fsPath
    if (targetPath.endsWith('.md')) {
        targetPath = path.dirname(targetPath)
    }
    const relativePath = path.relative(currentPath, targetPath).toLowerCase()
    const link = `[${words.join(" ")}](${relativePath}/#${words.join('-').toLowerCase()})`

    await editor.edit((editBuilder)=>{
        editBuilder.replace(selection, link)
    })
}


function getInsertPosition(doc: TextDocument) {
    for (let lineNum = doc.lineCount - 1; lineNum >= 0; lineNum--) {
        if (!doc.lineAt(lineNum).isEmptyOrWhitespace) {// the current line is not empty
            return lineNum
        }
    }
    return 0
}
