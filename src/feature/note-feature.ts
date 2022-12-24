import { commands, ExtensionContext, window, Selection, Range, workspace, TextDocument, Position } from 'vscode';

export function activate(context: ExtensionContext) {
    // "key": "alt+b"
    // "when": "editorHasSelection && editorLangId =~ /^markdown$|^rmd$|^quarto$/"
    context.subscriptions.push(
        commands.registerCommand('markdown.extension.note.highlight', () =>
            highlightSelectedTxt()
        )
    )
}

function highlightSelectedTxt() {
    const editor = window.activeTextEditor!;
    const selection = editor.selection;
    const curCursorPos = editor.selection.active;
    const className = workspace
        .getConfiguration("markdown.extension.note")
        .get<string>("highlightClass")!;
    const openTag = `<span class='${className}'>`;
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
                // `<span class='...'>te|xt</span>` ---> `te|xt`
                nextCursorPos = curCursorPos.translate(0, -openTag.length);
            } else {
                // `<spa|n class='...'>te|xt</spa|n>` ---> `|text`
                nextCursorPos = curCursorPos.with({ character: match.index! });
            }

            newSelection = new Selection(nextCursorPos, nextCursorPos);
        } else {
            // quick styling, wrap cursor
            // `|` ---> `<span class='...'>|</span>`
            repl = `<span class='${className}'></span>`;
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
