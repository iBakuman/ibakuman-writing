import * as fs from 'fs';
import * as path from 'path';
import { commands, env, ExtensionContext, TextDocument, window, workspace, WorkspaceEdit } from 'vscode';
import { configManager } from '../configuration/manager';
import * as moment from 'moment';
import { WorkspaceFolder } from 'vscode';

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        commands.registerCommand('markdown.extension.note.addTranslationToMD', () => {
            addCitation({
                path: "note.citation.translation.path",
                maxEntries: "note.citation.translation.maxEntries"
            })
        }),
        commands.registerCommand('markdown.extension.note.addWikiToMD', () => {
            addCitation({
                path: "note.citation.wiki.path",
                maxEntries: "note.citation.wiki.maxEntries"
            })
        }),
    )
}

interface CITATION_TYPE {
    path: "note.citation.translation.path" | "note.citation.wiki.path"
    maxEntries: "note.citation.translation.maxEntries" | "note.citation.wiki.maxEntries"
}

async function addCitation(cType: CITATION_TYPE) {
    const editor = window.activeTextEditor
    if (!editor) {
        return
    }
    const selection = editor.selection
    if (selection.isEmpty) {
        return
    }
    let workspaceFolders = workspace.workspaceFolders
    if (!workspaceFolders) {
        return
    }
    const workspacePath = workspaceFolders[0].uri.fsPath
    let citationDirPath = path.join(workspacePath, configManager.get(cType.path))

    let targetDoc = await getOrCreateDoc(citationDirPath, configManager.get(cType.maxEntries))
    const words = editor.document.getText(selection).trim().split(" ")
    // construct content to be inserted
    const heading = `## ${words.join(" ")}`
    const textOnClipboard = await env.clipboard.readText()
    const contentToInsert = `\n${heading}\n\n${textOnClipboard}`

    // insert translation to target doc
    const targetLineNum = _getInsertPosition(targetDoc)
    const edit = new WorkspaceEdit()
    edit.insert(targetDoc.uri, targetDoc.lineAt(targetLineNum).range.start.translate(1, 0), contentToInsert)
    const isOk = await workspace.applyEdit(edit)
    if (!isOk) {
        window.showErrorMessage('Insert content to target doc failed!')
        return
    }
    await targetDoc.save()

    // change the original doc to reference the content in target doc
    let targetPath = targetDoc.uri.fsPath

    let addr = targetPath.substring(workspacePath.length)
    if (addr.endsWith('.md')) {
        addr = addr.substring(0, addr.length - 3)
    }
    const link = `[${words.join(" ")}](${addr}#${words.join('-').toLowerCase()})`

    await editor.edit((editBuilder) => {
        editBuilder.replace(selection, link)
    })
}

async function getOrCreateDoc(dirPath: string, limit: number): Promise<TextDocument> {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }

    const fileNames = (await fs.promises.readdir(dirPath)).filter((name) => {
        return fs.statSync(path.join(dirPath, name)).isFile()
    })

    let filePath = path.join(dirPath, 'section-001.md')
    let [needCreate, id] = [true, 1]
    if (fileNames.length > 0) {
        const fileNameRegex = /^section-(\d{3}).md$/
        let [maxNum, maxFileName] = [0, '']
        for (const fileName of fileNames) {
            const execRes = fileNameRegex.exec(fileName)
            if (execRes) {
                const num = Number(execRes[1]);
                if (num > maxNum) {
                    maxNum = num
                    maxFileName = fileName
                }
            }
        }
        if (maxFileName) {
            // maxFileName already exists. check if the number of entries exceeds the specified limit.
            const doc = await workspace.openTextDocument(path.join(dirPath, maxFileName))
            let count = 0
            for (let lineNum = 0; lineNum < doc.lineCount; lineNum++) {
                const curLineText = doc.lineAt(lineNum).text
                if (curLineText.length >= 3 && curLineText.substring(0, 3) === '## ') {
                    count++
                }
            }
            if (count >= limit) {
                id = maxNum + 1
                filePath = path.join(dirPath, `section-${String(id).padStart(3, '0')}.md`)
                needCreate = true
            } else {
                // count < limit && maxFileName already exists.
                id = maxNum
                filePath = path.join(dirPath, maxFileName)
                needCreate = false
                // return doc
            }
        }
    }

    if (needCreate) {
        const currentTime = moment().utcOffset(moment().utcOffset()).format('YYYY-MM-DDTHH:mm:ssZ')
        const FRONT_MATTER = `---
title: "English Citation -- Section ${String(id).padStart(3, '0')}"
date: ${currentTime}
lastmod: ${currentTime}
author: iBakuman
categories: ["Citation"]
hidden: true
---\n`
        fs.writeFileSync(filePath, FRONT_MATTER)
    }

    const doc = await workspace.openTextDocument(filePath)
    return doc
}

function _getInsertPosition(doc: TextDocument) {
    for (let lineNum = doc.lineCount - 1; lineNum >= 0; lineNum--) {
        if (!doc.lineAt(lineNum).isEmptyOrWhitespace) {// the current line is not empty
            return lineNum
        }
    }
    return 0
}
