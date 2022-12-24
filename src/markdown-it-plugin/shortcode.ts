'use strict';

import MarkdownIt = require("markdown-it");
import Token = require("markdown-it/lib/token");
import StateBlock = require("markdown-it/lib/rules_block/state_block");


/*
{{< admonition note "Example Sentence" >}}

Katie and her new boyfriend are so cute, always going around hand in hand.

{{< /admonition >}}

Get inspired by https://github.com/docarys/markdown-it-admonition
*/

function renderDefault(tokens: Token[], idx: number, _options: any, env: any, self: any) {

    let token = tokens[idx];

    if (token.type === "admonition_open") {
        tokens[idx].attrPush(["class", "details admonition " + token.info]);
    }
    else if (token.type === "admonition_title_open") {
        tokens[idx].attrPush(["class", "details-summary admonition-title"]);
    }

    return self.renderToken(tokens, idx, _options, env, self);
}

function injectRenderRules(md: MarkdownIt) {
    let render = renderDefault;
    md.renderer.rules["admonition_open"] = render;
    md.renderer.rules["admonition_title_open"] = render;
    md.renderer.rules["admonition_title_close"] = render;
    md.renderer.rules["admonition_close"] = render;
}

abstract class ShortCode {
    type: string = '';

    validator(_params: string): boolean { return true };
    abstract changeState(state: StateBlock, startLine: number, endLine: number, params: string): void;
}

class Admonition extends ShortCode {
    override type: string = 'admonition';
    open_tag_markup: string = '{{< admonition ';
    closing_tag_markup: string = '{{< /admonition >}}';
    changeState(state: StateBlock, startLine: number, endLine: number, params: string) {
        let oldParent = state.parentType, oldLineMax = state.lineMax,
            token;

        let match = params.match(/(?<type>\w+) "(?<title>.*)"/);
        // abbreviation for admonition type
        let aType = match!.groups!.type, title = match!.groups!.title;

        // @ts-ignore
        state.parentType = this.type;

        // this will prevent lazy continuations from ever going past our end marker
        state.lineMax = endLine;

        token = state.push("admonition_open", "div", 1);
        token.markup = this.open_tag_markup;
        token.block = true;
        token.info = aType;
        token.map = [startLine, endLine];

        // admonition title
        token = state.push("admonition_title_open", "div", 1);
        token.markup = this.open_tag_markup;
        token.map = [startLine, endLine];

        token = state.push("inline", "", 0);
        token.content = title;
        token.map = [startLine, state.line - 1];
        token.children = [];

        token = state.push("admonition_title_close", "div", -1);
        token.markup = this.closing_tag_markup;

        state.md.block.tokenize(state, startLine + 1, endLine);

        token = state.push("admonition_close", "div", -1);
        token.markup = this.closing_tag_markup;
        token.block = true;

        state.parentType = oldParent;
        state.lineMax = oldLineMax;
        // state.line = endLine + (autoClosed ? 1 : 0);
        state.line = endLine + 1;
    }
}

const shortCodes: ShortCode[] = [new Admonition()]

interface PluginOptions {
    openTagPattern?: string | undefined;

    closeTagPattern?: string | undefined;
}

export function shortcodePlugin(md: MarkdownIt, options: PluginOptions) {

    options = options || {};

    let openTagPattern = options.openTagPattern || "{{< (?<type>\\w+) (?<params>.*?) ?>}}$",
        closeTagPattern = options.closeTagPattern || "{{< /(?<type>\\w+) >}}$",
        openTagChar = openTagPattern.charCodeAt(0), closeTagChar = closeTagPattern.charCodeAt(0);

    function shortcode(state: StateBlock, startLine: number, endLine: number, silent: boolean) {
        let autoClosed = false,
            start = state.bMarks[startLine] + state.tShift[startLine],
            max = state.eMarks[startLine],
            openTagRegex = new RegExp(openTagPattern), closeTagRegex = new RegExp(closeTagPattern);

        // Check out the first character quickly,
        // this should filter out most of non-containers
        if (openTagChar !== state.src.charCodeAt(start)) { return false; }

        // Check out the rest of the marker string
        let curLineText = state.src.substring(start, max);
        let match = curLineText.match(openTagRegex);
        if (match === null) {
            return false;
        }

        let shortCodeType = match!.groups!.type;
        let shortCodeParams = match!.groups!.params;
        let shortCode: ShortCode | null = null;
        for (const t of shortCodes) {
            if (t.type === shortCodeType) {
                shortCode = t
            }
        }
        if (shortCode === null || !shortCode.validator(shortCodeParams)) { return false; }

        // Since start is found, we can report success here in validation mode
        if (silent) { return true; }

        // Search for the end of the block
        let nextLine = startLine;

        for (; ;) {
            nextLine++;
            if (nextLine >= endLine) {
                // unclosed block should be closed automatically by end of document.
                // also block seems to be closed automatically by end of parent
                break;
            }

            start = state.bMarks[nextLine] + state.tShift[nextLine];
            max = state.eMarks[nextLine];

            if (start < max && state.sCount[nextLine] < state.blkIndent) {
                // non-empty line with negative indent should stop the list:
                // - ```
                //  test
                break;
            }

            // Check out the first character quickly,
            // this should filter out most of non-containers
            if (closeTagChar !== state.src.charCodeAt(start)) { continue; }
            // The current line text with the left spaces removed
            let curLineText = state.src.substring(start, max);
            let match = curLineText.match(closeTagRegex);
            if (match === null || match!.groups!.type === undefined || match!.groups!.type !== shortCodeType) {
                return false;
            }

            if (state.sCount[nextLine] - state.blkIndent >= 4) {
                // closing fence should be indented less than 4 spaces
                continue;
            }

            // found!
            autoClosed = true;
            break;
        }

        shortCode.changeState(state, startLine, nextLine, shortCodeParams);
        return true;
    }

    md.block.ruler.before("code", "shortcode", shortcode, {
        alt: ["paragraph", "reference", "blockquote", "list"]
    });
    injectRenderRules(md);
};
