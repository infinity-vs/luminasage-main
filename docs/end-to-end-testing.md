# End-to-End Testing Guide

This guide provides a comprehensive overview of the end-to-end (E2E) testing suite for the Dyad application. Our E2E tests are built using [Playwright](https://playwright.dev/), a powerful and reliable framework for browser automation.

## Overview

The E2E testing suite is designed to simulate real user interactions with the Dyad application to ensure that all features are working as expected. We use a Page Object Model (POM) to create a clean and maintainable test structure.

### Key Technologies

- **Playwright**: The core framework for browser automation and testing.
- **Page Object Model (POM)**: A design pattern that creates an object repository for UI elements, making tests more readable and easier to maintain.
- **Test Helpers**: A set of utility functions and fixtures that simplify common testing scenarios.

## Running Tests

To run the entire E2E testing suite, use the following command:

```bash
npm run test:e2e
```

To run a specific test file, you can pass the file path as an argument:

```bash
npm run test:e2e e2e-tests/chat_mode.spec.ts
```

## Writing a New Test

To write a new E2E test, follow these steps:

1.  **Create a new test file**: Create a new file in the `e2e-tests` directory with the `.spec.ts` extension (e.g., `my_new_feature.spec.ts`).

2.  **Import the test helper**: Import the `test` function from the `test_helper` module:

    ```typescript
    import { test } from "./helpers/test_helper";
    ```

3.  **Write a test case**: Write a test case using the `test` function. The first argument is a descriptive name for the test, and the second is an async function that receives a `po` (Page Object) instance.

    ```typescript
    test("my new feature should work correctly", async ({ po }) => {
      // Test logic goes here
    });
    ```

4.  **Use the Page Object**: The `po` object provides a set of methods for interacting with the application's UI. These methods are designed to be readable and intuitive.

    ```typescript
    test("chat mode selector - ask mode", async ({ po }) => {
      await po.setUp({ autoApprove: true });
      await po.importApp("minimal");

      await po.selectChatMode("ask");
      await po.sendPrompt("[dump] hi");
      await po.waitForChatCompletion();

      await po.snapshotServerDump("all-messages");
      await po.snapshotMessages({ replaceDumpPath: true });
    });
    ```

### Test Helpers and Utilities

The `po` object, provided by our test helper, abstracts away the complexities of interacting with the Playwright API. It includes methods for common actions such as:

-   `setUp(options)`: Initializes the test environment.
-   `importApp(appName)`: Imports a pre-configured application.
-   `selectChatMode(mode)`: Selects a specific chat mode.
-   `sendPrompt(prompt)`: Sends a prompt to the chat input.
-   `waitForChatCompletion()`: Waits for the chat to respond.
-   `snapshotServerDump(dumpName)`: Creates a snapshot of the server's state.
-   `snapshotMessages(options)`: Creates a snapshot of the chat messages.

For a complete list of available methods, please refer to the `e2e-tests/helpers/test_helper.ts` file.

## Best Practices

-   **Keep tests isolated**: Each test should be independent and not rely on the state of other tests.
-   **Use descriptive names**: Test names should clearly describe the feature being tested and the expected outcome.
-   **Leverage test helpers**: Use the provided test helpers to avoid duplicating code and keep tests clean.
-   **Create snapshots**: Use snapshots to verify the state of the UI and data at different points in the test.
