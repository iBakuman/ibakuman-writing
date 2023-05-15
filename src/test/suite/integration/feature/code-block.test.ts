import { configManager } from "../../../../configuration/manager";
import { resetConfiguration, updateConfiguration } from "../../util/configuration";
import { testCommand } from "../../util/generic";
import { Selection } from "vscode";

suite("Code Block.", () => {
    suiteSetup(async () => {
        await resetConfiguration();
    });

    suiteTeardown(async () => {
        await resetConfiguration();
    });

    /* ========================== Select All Code Block ========================= */
    test("Select all the code for the code block where the cursor is located", () => {
        return testCommand(
            "markdown.extension.codeblock.selectAll",
            ["```javascript", "console.log(1)", "console.log(2)", "end", "```"],
            new Selection(1, 0, 1, 0),
            ["```javascript", "console.log(1)", "console.log(2)", "end", "```"],
            new Selection(1, 0, 3, 3)
        );
    });
    /* ======================== Select All Code Block End ======================= */

    /* ========================= Toggle Code Block Test ========================= */
    suite("Test Toggle Code Block Feature", () => {
        const code = 'console.log("Hello world")';
        let defaultLang = 'javascript';
        let fencedCodeIndicator = '```';
        suiteSetup(async () => {
            await resetConfiguration();
            defaultLang = configManager.get("codeblock.defaultLanguage")
            fencedCodeIndicator += defaultLang;
        })

        suiteTeardown(async () => {
            await resetConfiguration();
        })

        test("Toggle code block when the defaultLang has not been modified", () => {
            return testCommand(
                'markdown.extension.editing.toggleCodeBlock',
                [code, code, code],
                new Selection(0, 0, 2, code.length),
                [fencedCodeIndicator, code, code, code, '```'],
                new Selection(0, 3, 0, fencedCodeIndicator.length)
            )
        })

        test("Toggle code block when the defaultLang has been modified", async () => {
            const newLang = "cs";
            await updateConfiguration({ config: [["markdown.extension.codeblock.defaultLanguage", newLang]] });
            const code = 'Console.WriteLine("Hello world!")';
            const fencedCodeIndicator = '```' + newLang;

            return testCommand(
                'markdown.extension.editing.toggleCodeBlock',
                [code, code, code],
                new Selection(0, 0, 2, code.length),
                [fencedCodeIndicator, code, code, code, '```'],
                new Selection(0, 3, 0, fencedCodeIndicator.length)
            ).then(async () => {
                await updateConfiguration({ config: [["markdown.extension.codeblock.defaultLanguage", defaultLang]] });
            })
        })

        test("Toggle code block when the selection is full of blank lines", async () => {
            return testCommand(
                'markdown.extension.editing.toggleCodeBlock',
                [' ', ''],
                new Selection(0, 0, 1, 0),
                [' ', fencedCodeIndicator, '', '```'],
                new Selection(1, 3, 1, fencedCodeIndicator.length)
            )
        })

        test("Toggle code block when the selection has prefix blank lines", async () => {
            return testCommand(
                'markdown.extension.editing.toggleCodeBlock',
                [' ', code, code],
                new Selection(0, 0, 2, code.length),
                [' ', fencedCodeIndicator, code, code, '```'],
                new Selection(1, 3, 1, fencedCodeIndicator.length)
            )
        })

        test("Toggle code block when the selection has suffix blank lines", async () => {
            return testCommand(
                'markdown.extension.editing.toggleCodeBlock',
                [code, code, ''],
                new Selection(0, 0, 2, 0),
                [fencedCodeIndicator, code, code, '```', ''],
                new Selection(0, 3, 0, fencedCodeIndicator.length)
            )
        })

        test("Toggle code block when the selection has prefix and suffix blank line", async () => {
            return testCommand(
                'markdown.extension.editing.toggleCodeBlock',
                [' ', code, code, code, ''],
                new Selection(0, 0, 4, 0),
                [' ', fencedCodeIndicator, code, code, code, '```', ''],
                new Selection(1, 3, 1, fencedCodeIndicator.length)
            )
        })

    })
    /* ======================= Toggle Code Block Test End ======================= */
});
