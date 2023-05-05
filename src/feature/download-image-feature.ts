import { fileTypeFromBuffer } from "file-type";
import filenamify from "filenamify";
import { existsSync } from 'fs';
import got from 'got';
import isSvg from "is-svg";
import { commands, ExtensionContext, Range, Uri, window, workspace } from 'vscode';
import path = require('path');

import { linkHashes } from '../util/linkHash';
import { configManager } from "../configuration/manager";

export function activate(context: ExtensionContext) {
    // "key": "alt+b"
    // "when": "editorHasSelection && editorLangId =~ /^markdown$|^rmd$|^quarto$/"
    context.subscriptions.push(
        commands.registerCommand('markdown.extension.downloadAllImage', () => downloadAllImages()),
    )
}

async function downloadAllImages() {
    const folder = configManager.get('downloadImage.folder');
    const editor = window.activeTextEditor!;
    const content = editor.document.getText();
    const assetsFolder = Uri.joinPath(editor.document.uri, '..', folder);
    await workspace.fs.createDirectory(assetsFolder);

    const EXTERNAL_MEDIA_LINK_PATTERN = /\!\[(?<anchor>.*?)\]\((?<link>.+?)\)/g;
    const fixedContent = await replaceAsync(content, EXTERNAL_MEDIA_LINK_PATTERN, imageTagProcessor(assetsFolder, folder));
    if (fixedContent != content) {
        console.log('content changed!');
        editor.edit((editBuilder) => {
            const doc = editor.document;
            editBuilder.replace(new Range(doc.lineAt(0).range.start, doc.lineAt(doc.lineCount - 1).range.end), fixedContent);
        }).then(() => {
            // editor.selection = oldSelection;
        })
    } else {
        console.log('content not changed!');
    }
}

async function replaceAsync(str: any, regex: RegExp | string, asyncFn: any): Promise<string> {
    const promises: Promise<any>[] = [];
    str.replace(regex, (match: string, ...args: any) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}

async function downloadImage(url: string): Promise<Buffer> {
    // got.stream(url).pipe(createWriteStream(filePath));
    const res = await got(url, { responseType: "buffer" });
    return res.body;
}

async function fileExtByContent(content: Buffer) {
    const fileExt = (await fileTypeFromBuffer(content))?.ext;

    // if XML, probably it is SVG
    if (fileExt == "xml") {
        if (isSvg(content)) return "svg";
    }

    return fileExt;
}

async function chooseFileName(dir: Uri, baseName: string, link: string, contentData: Buffer)
    : Promise<{ fileUri: Uri | null; needWrite: boolean }> {

    const FILENAME_TEMPLATE = "media";
    const fileExt = await fileExtByContent(contentData);
    if (!fileExt) {
        return { fileUri: null, needWrite: false };
    }
    // if there is no anchor try get file name from url
    if (!baseName) {
        const parsedUrl = new URL(link);
        baseName = path.basename(parsedUrl.pathname);
        // if there is no part for file name from url use name template
        if (!baseName) {
            baseName = FILENAME_TEMPLATE;
        }
    }

    // if filename already ends with correct extension, remove it to work with base name
    if (baseName.endsWith(`.${fileExt}`)) {
        baseName = baseName.slice(0, -1 * (fileExt.length + 1));
    }

    baseName = filenamify(baseName).replace(/\s+/g, '_');

    let fileUri = null;
    let needWrite = true;
    let index = 0;
    const MAX_FILENAME_INDEX = 1000;
    while (!fileUri && index < MAX_FILENAME_INDEX) {
        const suggestedName = index
            ? Uri.joinPath(dir, `${baseName}-${index}.${fileExt}`)
            : Uri.joinPath(dir, `${baseName}.${fileExt}`)

        if (existsSync(suggestedName.fsPath)) {
            linkHashes.ensureHashGenerated(link, contentData);

            const fileData = await workspace.fs.readFile(suggestedName);

            if (linkHashes.isSame(link, fileData)) {
                fileUri = suggestedName;
                needWrite = false;
            }
        } else {
            fileUri = suggestedName;
        }

        index++;
    }
    if (!fileUri) {
        throw new Error("Failed to generate file name for media file.");
    }

    linkHashes.ensureHashGenerated(link, contentData);

    return { fileUri: fileUri, needWrite };
}

function imageTagProcessor(mediaDir: Uri, folder: string) {
    async function processImageTag(match: string, anchor: string, link: string) {
        if (!isUrl(link)) {
            return match;
        }

        try {
            const fileData = await downloadImage(link);
            const { fileUri, needWrite } = await chooseFileName(mediaDir, anchor, link, fileData);

            if (fileUri && needWrite) {
                await workspace.fs.writeFile(fileUri, fileData);
            }

            if (fileUri) {
                return `![${anchor}](${folder + '/' + path.basename(fileUri.fsPath)})`;
            } else {
                return match;
            }

        } catch (error) {
            console.warn("Image processing failed: ", error);
            return match;
        }
    }
    return processImageTag;
}

function isUrl(link: string) {
    try {
        return Boolean(new URL(link));
    } catch (_) {
        return false;
    }
}
