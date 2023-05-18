import type { MarkdownBulletListMarker, MarkdownEmphasisIndicator, MarkdownStrongEmphasisIndicator } from "../contract/MarkdownSpec";
import type { SlugifyMode } from "../contract/SlugifyMode";

/**
 * A map from our configuration keys to the corresponding type definitions.
 * These keys are relative to `markdown.extension`.
 * Should keep in sync with `package.json`.
 */
export interface IConfigurationKeyTypeMap {
    "completion.respectVscodeSearchExclude": boolean;
    "completion.root": string;

    "italic.indicator": MarkdownEmphasisIndicator;
    "bold.indicator": MarkdownStrongEmphasisIndicator;

    /**
     * A collection of custom macros.
     * @see {@link https://katex.org/docs/options.html}
     */
    "katex.macros": { [key: string]: string };

    "list.indentationSize": "adaptive" | "inherit";

    "math.enabled": boolean;

    "orderedList.autoRenumber": boolean;
    "orderedList.marker": "one" | "ordered";

    "preview.autoShowPreviewToSide": boolean;

    "print.absoluteImgPath": boolean;
    "print.imgToBase64": boolean;
    "print.includeVscodeStylesheets": boolean;
    "print.onFileSave": boolean;
    "print.theme": "dark" | "light";
    "print.validateUrls": boolean;

    /** To be superseded. */
    "syntax.decorationFileSizeLimit": number;
    /** To be superseded. */
    "syntax.plainTheme": boolean;

    "tableFormatter.enabled": boolean;
    "tableFormatter.normalizeIndentation": boolean;
    "tableFormatter.delimiterRowNoPadding": boolean;

    /** Formerly "syntax.decorations" */
    "theming.decoration.renderCodeSpan": boolean;
    "theming.decoration.renderHardLineBreak": boolean;
    "theming.decoration.renderLink": boolean;
    "theming.decoration.renderParagraph": boolean;
    /** Formerly "syntax.decorations" */
    "theming.decoration.renderStrikethrough": boolean;
    "theming.decoration.renderTrailingSpace": boolean;

    "toc.levels": string;
    /** To be superseded. */
    "toc.omittedFromToc": { [path: string]: string[] };
    "toc.orderedList": boolean;
    "toc.plaintext": boolean;
    "toc.slugifyMode": SlugifyMode;
    "toc.unorderedList.marker": MarkdownBulletListMarker;
    "toc.updateOnSave": boolean;

    /** default lang for codeblock */
    "codeblock.defaultLanguage": string;

    /** note-feature config */
    "note.translation.class": string;
    /** The path of translation file relative to the workspace */
    "note.citation.translation.path": string;
    "note.citation.translation.maxEntries": number;
    "note.citation.wiki.path": string;
    "note.citation.wiki.maxEntries": number;
    "note.highlightClass": string;

    /** leetcode */
    "leetcode.problemDir": string;

    /** the folder where the downloaded images are stored */
    "downloadImage.folder": string;

    /** The name of the field that stores the last modified date in the front matter*/
    "autoUpdateLastModifiedTime.fieldName": string;

    /** Whether to enable automatic updating of the last modification time when saving a file */
    "autoUpdateLastModifiedTime.enable": boolean;

}

/**
 * Configuration keys that this product contributes.
 * These keys are relative to `markdown.extension`.
 */
export type IConfigurationKnownKey = keyof IConfigurationKeyTypeMap;
