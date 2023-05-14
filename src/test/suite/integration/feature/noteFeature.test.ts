import { env, Selection, workspace } from 'vscode';
import { resetConfiguration } from "../../util/configuration";
import { testCommand } from "../../util/generic";
import { configManager } from '../../../../configuration/manager';

suite("Note Features.", () => {
    suiteSetup(async () => {
        await resetConfiguration();
    });

    suiteTeardown(async () => {
        await resetConfiguration();
    });

    suite("Highlight Selected Text.", () => {
        const className = workspace
            .getConfiguration("markdown.extension.note")
            .get<string>("highlightClass")!;
        const openTag = `<span class="${className}">`;
        const closeTag = `</span>`;

        suiteSetup(async () => {
            await resetConfiguration();
        });

        suiteTeardown(async () => {
            await resetConfiguration();
        });

        test("Take away highlight style when the cursor is between text", () => {
            const text = "Hello";
            const highlighted = openTag + text + closeTag;
            // ...He|llo...
            const character = openTag.length + 2;
            return testCommand(
                "markdown.extension.note.highlight",
                [highlighted],
                new Selection(0, character, 0, character),
                [text],
                new Selection(0, 2, 0, 2)
            );
        });

        test("Take away highlight style when the cursor is between highligh tag", () => {
            const text = "Hello";
            const highlighted = openTag + text + closeTag;
            // <|span...
            const character = 1;
            return testCommand(
                "markdown.extension.note.highlight",
                [highlighted],
                new Selection(0, character, 0, character),
                [text],
                new Selection(0, 0, 0, 0)
            );
        })

        test("Quick styling", () => {
            const text = "Hello";
            const highlighted = openTag + closeTag + text;
            const character = 0;
            return testCommand(
                "markdown.extension.note.highlight",
                [text],
                new Selection(0, character, 0, character),
                [highlighted],
                new Selection(0, character + openTag.length, 0, character + openTag.length)
            );
        })

        test("Add highlight style to the selected text", () => {
            const selected = "Hello";
            const highlighted = openTag + selected + closeTag;
            const character = 0;
            return testCommand(
                "markdown.extension.note.highlight",
                [selected],
                new Selection(0, 0, 0, selected.length),
                [highlighted],
                new Selection(0, openTag.length, 0, highlighted.length - closeTag.length)
            );
        })
    });

    suite("Add Translation Text.", () => {
        const className = configManager.get('note.translation.class')

        suiteSetup(async () => {
            await resetConfiguration();
        });

        suiteTeardown(async () => {
            await resetConfiguration();
        });

        test("Add Translation from clipboard.", async () => {
            await env.clipboard.writeText('translation');
            const expected = `<span class="${className}">text<sub> { translation }</sub></span>`;
            return testCommand(
                'markdown.extension.note.addTranslation',
                ['text'], new Selection(0, 0, 0, 4),
                [expected], new Selection(0, 0, 0, expected.length)
            );
        });
    })
})

