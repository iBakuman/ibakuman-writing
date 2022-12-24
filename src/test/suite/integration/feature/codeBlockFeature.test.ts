import { resetConfiguration } from "../../util/configuration";
import { testCommand } from "../../util/generic";
import { Selection } from "vscode";

suite("Code Block Related Operations.", () => {
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
});
