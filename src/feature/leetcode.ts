import { commands, env, ExtensionContext, Position, Range, Selection, TextDocument, TextEditor, window, workspace, WorkspaceEdit } from 'vscode';
import { configManager } from '../configuration/manager';
import * as path from 'path';
import * as fs from 'fs';
import moment = require('moment');

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        commands.registerCommand('markdown.extension.leetcode.formatProblem', () => formatProblem()),
        commands.registerCommand('markdown.extension.leetcode.createProblemDir', () => createProblemDir())
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


async function createProblemDir() {
    const editor = window.activeTextEditor
    if (!editor) {
        return
    }

    const textOnClipboard = await env.clipboard.readText()
    let problemName: string
    if (!textOnClipboard.startsWith('http') || !textOnClipboard.endsWith('/')) {
        return
    }

    const words = textOnClipboard.split('/')
    problemName = words[words.length - 2]

    let leetcodeDir = configManager.get('leetcode.problemDir')
    if (!leetcodeDir.startsWith('/')) {
        let workspaceFolders = workspace.workspaceFolders
        if (!workspaceFolders) {
            return
        }
        const workspacePath = workspaceFolders[0].uri.fsPath
        leetcodeDir = path.join(workspacePath, leetcodeDir)
    }

    const serialId = await window.showInputBox({placeHolder: "Input the serial id of specified problem"})
    if (serialId) {
        problemName = serialId?.padStart(4, '0') + '-' + problemName
    }
    let problemDirPath = path.join(leetcodeDir, problemName)
    if (!fs.existsSync(problemDirPath)) {
        fs.mkdirSync(problemDirPath, { recursive: true })
    }

    const currentTime = moment().utcOffset(moment().utcOffset()).format('YYYY-MM-DDTHH:mm:ssZ')
    const FRONT_MATTER = `---
title:
date: ${currentTime}
lastmod: ${currentTime}
author: iBakuman
categories: ["LeetCode"]
tags: [""]
---

## 题目描述



## 解法一：

`
    const problemFilePath = path.join(problemDirPath, 'index.zh-cn.md')
    if (!fs.existsSync(problemFilePath)) {
        fs.writeFileSync(problemFilePath, FRONT_MATTER)
    }
    workspace.openTextDocument(problemFilePath).then((doc) => {
        window.showTextDocument(doc)
    })
}
