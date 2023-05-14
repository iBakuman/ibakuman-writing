import { ExtensionContext } from 'vscode';
import * as frontMatter from './auto-update-lastmod-time';
import * as codeBlock from './code-block';
import * as downloadImage from './download-image';
import * as heading from './heading-level';
import * as leetcode from './leetcode';
import * as markup from './markup';
import * as citation from './citation';

export function activate(context: ExtensionContext) {
    // Code block related operations
    codeBlock.activate(context)
    // Note related feature
    markup.activate(context)
    // Download all images feature
    downloadImage.activate(context)
    // Auto update last modified time
    frontMatter.activate(context)
    // Heading Level related feature
    heading.activate(context)
    // LeetCode related feature
    leetcode.activate(context)
    // Citation
    citation.activate(context)
}
