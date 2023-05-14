import { commands, ExtensionContext, window, Selection, Range, TextDocument } from "vscode";
import { commonMarkEngine } from "../markdownEngine";
import * as vscode from "vscode";
import { configManager } from "../configuration/manager";

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        commands.registerCommand("markdown.extension.codeblock.selectAll", () => selectAll()),
        commands.registerCommand('markdown.extension.editing.toggleCodeBlock', () => toggleCodeBlock()),
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

function toggleCodeBlock() {
    const editor = window.activeTextEditor!;
    if (editor.selection.isEmpty) {
        return;
    }
    const shrunkSelection = shrinkSelection(editor.document, editor.selection);
    const defaultLang = configManager.get('codeblock.defaultLanguage');
    const startLineIndex = shrunkSelection.start.line;
    // Range class is the super class of Selection class.
    const repl = `\`\`\`${defaultLang}\n${editor.document.getText(shrunkSelection)}\n\`\`\``;
    return editor
        .edit((editBuilder) => {
            editBuilder.replace(shrunkSelection, repl);
        })
        .then(() => {
            editor.selection = new Selection(
                startLineIndex,
                3,
                startLineIndex,
                3 + defaultLang.length
            );
        });
}


/**
 * Shrinks the selection area so that it does not contain the beginning and ending blank line.
 * NOTE: Returns a selection field containing one empty line when all selection fields are empty.
 * @param selection the original selection obj.
 * @returns The shrunk selection.
 */
function shrinkSelection(doc: TextDocument, origin: Selection): Selection {
    // shrink
    let start = origin.start.line;
    let end = origin.end.line;
    while (start < end) {
        if (doc.lineAt(start).isEmptyOrWhitespace) {
            start++;
        } else {
            break;
        }
    }
    while (start < end) {
        if (doc.lineAt(end).isEmptyOrWhitespace) {
            end--;
        } else {
            break;
        }
    }
    let character = doc.lineAt(end).text.length;
    return new Selection(start, 0, end, character);
}
