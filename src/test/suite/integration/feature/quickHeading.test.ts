import { resetConfiguration } from "../../util/configuration"
import { testCommand } from "../../util/generic";
import { Selection } from 'vscode';

suite("Quick Heading", () => {
    suiteSetup(async () => {
        await resetConfiguration;
    })

    suiteTeardown(async () => {
        await resetConfiguration;
    })

    /* =============== Toggle Between Heading Level And Plain Text ============== */
    test("Toggle heading level1. `heading|` -> `# heading|`", () => {
        return testCommand("markdown.extension.heading.toggleLevel1",
            ['heading'], new Selection(0, 7, 0, 7),
            ['# heading'], new Selection(0, 9, 0, 9)
        );
    })

    test("Toggle heading level1. `# heading|` -> `heading|`", () => {
        return testCommand("markdown.extension.heading.toggleLevel1",
            ['# heading'], new Selection(0, 9, 0, 9),
            ['heading'], new Selection(0, 7, 0, 7)
        );
    })

    test("Toggle heading level2. `heading|` -> `## heading|`", () => {
        return testCommand("markdown.extension.heading.toggleLevel2",
            ['heading'], new Selection(0, 7, 0, 7),
            ['## heading'], new Selection(0, 10, 0, 10)
        );
    })

    test("Toggle heading level2. `## heading|` -> `heading|`", () => {
        return testCommand("markdown.extension.heading.toggleLevel2",
            ['## heading'], new Selection(0, 10, 0, 10),
            ['heading'], new Selection(0, 7, 0, 7)
        );
    })

    test("Toggle heading level3. `heading|` -> `### heading|`", () => {
        return testCommand("markdown.extension.heading.toggleLevel3",
            ['heading'], new Selection(0, 7, 0, 7),
            ['### heading'], new Selection(0, 11, 0, 11)
        );
    })

    test("Toggle heading level3. `### heading|` -> `heading|`", () => {
        return testCommand("markdown.extension.heading.toggleLevel3",
            ['### heading'], new Selection(0, 11, 0, 11),
            ['heading'], new Selection(0, 7, 0, 7)
        );
    })

    test("Toggle heading level4. `heading|` -> `#### heading|`", () => {
        return testCommand("markdown.extension.heading.toggleLevel4",
            ['heading'], new Selection(0, 7, 0, 7),
            ['#### heading'], new Selection(0, 12, 0, 12)
        );
    })

    test("Toggle heading level4. `#### heading|` -> `heading|`", () => {
        return testCommand("markdown.extension.heading.toggleLevel4",
            ['#### heading'], new Selection(0, 12, 0, 12),
            ['heading'], new Selection(0, 7, 0, 7)
        );
    })

    test("Toggle heading level5. `heading|` -> `##### heading|`", () => {
        return testCommand("markdown.extension.heading.toggleLevel5",
            ['heading'], new Selection(0, 7, 0, 7),
            ['##### heading'], new Selection(0, 13, 0, 13)
        );
    })

    test("Toggle heading level5. `##### heading|` -> `heading|`", () => {
        return testCommand("markdown.extension.heading.toggleLevel5",
            ['##### heading'], new Selection(0, 13, 0, 13),
            ['heading'], new Selection(0, 7, 0, 7)
        );
    })

    test("Toggle heading level6. `heading|` -> `###### heading`", () => {
        return testCommand("markdown.extension.heading.toggleLevel6",
            ['heading'], new Selection(0, 7, 0, 7),
            ['###### heading'], new Selection(0, 14, 0, 14)
        );
    })

    test("Toggle heading level6. `###### heading|` -> `heading`", () => {
        return testCommand("markdown.extension.heading.toggleLevel6",
            ['###### heading'], new Selection(0, 14, 0, 14),
            ['heading'], new Selection(0, 7, 0, 7)
        );
    })
    /* ============= Toggle Between Heading Level And Plain Text End ============ */

    /* ================= Switch Between Different Heading Levels ================ */
    test("Transform heading level 2 to heading level 1: `## heading|` -> `# heading|`", () => {
        return testCommand("markdown.extension.heading.toggleLevel1",
            ['## heading'], new Selection(0, 10, 0, 10),
            ['# heading'], new Selection(0, 9, 0, 9));
    })

    test("Transform heading level 1 to heading level 2: `# heading|` -> `## heading|`", () => {
        return testCommand("markdown.extension.heading.toggleLevel2",
            ['# heading'], new Selection(0, 9, 0, 9),
            ['## heading'], new Selection(0, 10, 0, 10));
    })
    /* =============== Switch Between Different Heading Levels End ============== */
})
