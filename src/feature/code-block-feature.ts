import { commands, ExtensionContext, window, Selection, Range } from "vscode";
import { commonMarkEngine } from "../markdownEngine";
import * as vscode from "vscode";

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        commands.registerCommand("markdown.extension.codeblock.selectAll", () =>
            selectAll()
        )
    );
}
// The commands here are only bound to keys with `when` clause containing `editorTextFocus && !editorReadonly`. (package.json)
// So we don't need to check whether `activeTextEditor` returns `undefined` in most cases.
function selectAll() {
    const editor = window.activeTextEditor!;
    const lineIndex = editor.selection.active.line;
    const [start, end] = getCodeRange(editor.document, lineIndex);
    if (start === -1) {
        return;
    } else {
        editor.selection = new Selection(
            start + 1,
            0,
            end - 2,
            editor.document.lineAt(end - 2).text.length
        );
    }
}

function getCodeRange(
    doc: vscode.TextDocument,
    lineIndex: number
): [number, number] {
    const { tokens } = commonMarkEngine.getDocumentToken(doc);
    for (const token of tokens) {
        if (
            token.type === "fence" &&
            token.tag === "code" &&
            token.map![0] <= lineIndex &&
            lineIndex < token.map![1]
        ) {
            return [token.map![0], token.map![1]];
        }
    }

    return [-1, -1];
}
