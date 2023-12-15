import {commands, env, ExtensionContext, Position, Range, Selection, window} from 'vscode';
import {configManager} from '../configuration/manager';
import path = require('path');

export function activate(context: ExtensionContext) {
    // "key": "alt+b"
    // "when": "editorHasSelection && editorLangId =~ /^markdown$|^rmd$|^quarto$/"
    context.subscriptions.push(
        commands.registerCommand('markdown.extension.note.highlight', () => highlightSelectedTxt()),
        commands.registerCommand('markdown.extension.note.addTranslation', () => addTranslation()),
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
                nextCursorPos = curCursorPos.with({character: match.index!});
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
    const curCursorPos = editor.selection.active;

    let content = ''
    if (selection.isEmpty) {
        // get the word under cursor
        const wordRange = editor.document.getWordRangeAtPosition(curCursorPos)
        if (wordRange === undefined) {
            // no word under cursor
            return;
        }
        content = editor.document.getText(wordRange);
    } else {
        content = editor.document.getText(selection);
    }

    const className = configManager.get("note.translation.class")
    const translation = await env.clipboard.readText();
    // const repl = `<span class="${className}">${content}<sub> { ${translation} }</sub></span>`;
    const sub1 = `<span class="${className}" data-hover-text="`
    const sub2 = `${translation}">${content}</span>`;
    const repl = sub1 + sub2;

    return editor.edit((editBuilder) => {
        editBuilder.replace(selection, repl);
    }).then(() => {
        editor.selection = new Selection(
            selection.start.translate(0, sub1.length),
            selection.start.translate(0, sub1.length + translation.length)
        )
    })
}

