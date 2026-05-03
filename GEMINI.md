# Project Policies

- **Test Execution Policy**: The agent must NOT run Playwright tests autonomously. When requested to fix test issues, the agent should only analyze the existing test reports in the `test-results/` folder and propose fixes based on those findings. All test execution is reserved for the user to perform in their own terminal.
