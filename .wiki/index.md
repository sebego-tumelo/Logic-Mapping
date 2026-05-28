### Master Index Documentation

This document provides a comprehensive overview of the `Logic-Mapping` project, detailing its file architecture, domain dependencies, and primary API entry points. The project primarily focuses on training and inferring binary logic mappings using TensorFlow.js, with an additional utility for maintaining project documentation via AI.

### 1. Project Overview

`Logic-Mapping` is a Node.js command-line interface (CLI) application that leverages TensorFlow.js to train a simple neural network on binary input-output pairs. Once trained, the model can predict outputs for new binary inputs. It's designed for educational purposes, allowing users to experiment with basic logic functions or mappings. A separate script `sync-wiki.mjs` uses Google's GenAI and Repomix to auto-generate and update project documentation.

The neural network architecture used for logic mapping consists of:
*   An input layer with `inputShape` units and ReLU activation.
*   A hidden layer with 16 units and ReLU activation (or 32 and 16 units in `index.js`).
*   An output layer with `outputShape` units and Sigmoid activation.
The model is trained using `binaryCrossentropy` loss and the Adam optimizer.

### 2. File Architecture

The codebase is structured into the following key files and directories:

*   **`/my-logic-model`**: This directory stores the trained TensorFlow.js model.
    *   `model.json`: Contains the model's architecture (topology) as a TF.js `Sequential` model with two Dense layers, including configurations for activations (`relu`, `sigmoid`), units, and initializers (e.g., `kernel_initializer` and `bias_initializer`).
    *   `weights.bin`: Stores the trained weights (kernel and bias) of the neural network corresponding to `model.json`.
*   **`.gitignore`**: Standard ignore file for Node.js projects, excluding `node_modules`, build artifacts, environment files, and IDE-specific configurations.
*   **`index.js`**: The main entry point for the Logic-Mapping CLI application. It handles user interaction via `readline`, parses training data, builds and trains a TensorFlow.js model, saves the model, and performs inference. It also includes polyfills for Node.js v24 compatibility. Key constants like `LOGIC_PREFIX`, `MODEL_PATH`, `RESET`, `USER_PREFIX`, and module imports such as `fs`, `readline` (and its instance `rl`), `tf` (TensorFlow.js), and `util` are defined within this file. The global `model` variable stores the loaded or trained TensorFlow.js model.
*   **`index_v2.js`**: An additional script that appears to mirror the functionality and structure of `index.js`. It defines the same set of constants (`LOGIC_PREFIX`, `MODEL_PATH`, `RESET`, `USER_PREFIX`) and module imports (`fs`, `readline`, `rl`, `tf`, `util`) along with core functions (`showMainMenu`, `handleMainMenu`, `promptForTrainingData`, `trainModel`, `askInference`, `runInference`, `parseDataMap`, `enterHelpMode`, `checkCommands`). Its exact role (e.g., alternative entry point, historical version, or experimental branch) is implied to be similar to `index.js` based on the shared symbols.
*   **`package.json`**: The Node.js project manifest file. It defines project metadata (name, version, description, author, license, keywords), script commands for execution (`start` for `index.js`, `update` for `sync-wiki.mjs`, `wiki:init` for `repomix`), and lists all project dependencies and devDependencies. It's configured as an ES module (`"type": "module"`).
*   **`README.md`**: Provides a high-level description of the project, installation instructions, detailed usage guidelines, input requirements, example workflows, and compatibility notes. It includes chapters and sections such as `Logic-Mapping`, `Description`, `How It Works`, `Installation`, `Usage`, `Input Requirements`, `Example Workflow`, `Navigation`, `Compatibility`, and `License`.
*   **`sync-wiki.mjs`**: A utility script responsible for generating and incrementally updating the project's documentation (`.wiki/index.md`) using a large language model (Google GenAI) and a code-bundling tool (Repomix). It manages a state file (`.wiki/wiki_state.json`) to track the last synced Git commit. It utilizes the `ai` constant for the GoogleGenAI instance and includes helper functions like `cleanMarkdown` and the main `runWikiEngine` orchestrator. The `runWikiEngine` function internally defines an `initialState` object with `version` and `last_synced_commit` properties.
*   **`test_mapping.js`**: A dedicated script for programmatically loading a trained TensorFlow.js model and testing it against a predefined set of binary input-output test cases. It reports the accuracy of the model's predictions in a tabular format. This file includes a polyfill definition for `util.isNullOrUndefined`.

### 3. Domain Dependencies

The project relies on several key external libraries and Node.js built-in modules:

*   **`@tensorflow/tfjs-node`**: The core machine learning library for the project, providing TensorFlow.js functionalities optimized for Node.js environments. It is used for building, training, saving, loading, and running neural networks in `index.js`, `index_v2.js`, and `test_mapping.js` via the `tf` constant.
*   **`@google/genai`**: Google's official client library for interacting with the Gemini API. It is exclusively used by `sync-wiki.mjs` for AI-driven documentation generation and updates, typically initialized with an `apiKey` from environment variables, accessed via the `ai` constant.
*   **`repomix`**: A CLI tool that merges the entire codebase into a single document. It is used programmatically by `sync-wiki.mjs` to create a `codebase-snapshot.xml` which is then fed to the Gemini API. Also available as an `npm script` (`wiki:init`).
*   **`readline` (Node.js built-in)**: Used by `index.js` and `index_v2.js` for handling asynchronous user input and displaying output in the command-line interface via a `rl` (readline interface) instance.
*   **`fs` (Node.js File System built-in)**: Used extensively for file operations:
    *   `index.js` and `index_v2.js`: Saving and loading TensorFlow.js models.
    *   `sync-wiki.mjs`: Creating directories, reading/writing `wiki_state.json`, reading `codebase-snapshot.xml`, writing `index.md`, and deleting temporary files.
*   **`child_process` (Node.js built-in)**: Specifically `execSync`, used by `sync-wiki.mjs` to execute shell commands such as `git rev-parse --short HEAD` (to get commit SHAs), `npx repomix` (to generate code snapshots), and `git diff` (to get code changes).
*   **`path` (Node.js built-in)**: Used by `sync-wiki.mjs` for constructing and normalizing file paths (e.g., `path.join`).
*   **`util` (Node.js built-in)**: This module is utilized by `index.js`, `index_v2.js`, and `test_mapping.js`. A polyfill for `util.isNullOrUndefined` is explicitly implemented within `test_mapping.js` (and potentially mirrored in `index_v2.js` if it's a direct copy) to ensure compatibility with Node.js v24, where this function was removed.

### 4. API Entry Points and Main Functions

The project has three primary execution paths:

#### 4.1. Logic Mapping CLI (`index.js` and `index_v2.js`)

*   **Entry Point**: `node index.js` or `npm start` (for `index.js`). `index_v2.js` can be executed similarly.
*   **Main Functions/Flows**: (These functions are present in both `index.js` and `index_v2.js`)
    *   `showMainMenu()`: Initializes the CLI, presenting options to "Load model" or "Train model".
    *   `handleMainMenu(choice)`: Processes user input from the main menu, either attempting to load a saved model or prompting for training data.
    *   `promptForTrainingData()`: Collects a string of binary input-output pairs from the user for model training.
    *   `trainModel(dataString)`: The core training logic. It takes a data map string, parses it using `parseDataMap`, constructs a `tf.sequential` model (Dense layers with ReLU and Sigmoid activations), compiles it with `tf.train.adam` optimizer and `binaryCrossentropy` loss, trains the model, and then saves it to `my-logic-model`.
    *   `askInference()`: After a model is loaded or trained, this function prompts the user to enter binary inputs for prediction.
    *   `runInference(inputStr)`: Performs inference. It takes a binary input string, converts it to a `tf.tensor2d`, uses `model.predict()`, rounds the output to binary (0s or 1s), and prints the resulting binary string.
    *   `parseDataMap(inputString)`: Utility function to convert a user-provided string (e.g., `[000 - 1110, 001 - 0001]`) into `tf.tensor2d` instances for inputs (`xs`) and outputs (`ys`), along with input and output shapes.
    *   `enterHelpMode(returnCallback)`: Displays available commands (`/home`, `/help`, `/exit`) and allows navigation back to the previous context.
    *   `checkCommands(input)`: A global helper function that checks for and handles top-level commands like `/exit` and `/home`, returning to the main menu or exiting the application.
*   **Key Constants/Variables**: (These are global constants/variables in both `index.js` and `index_v2.js`)
    *   `LOGIC_PREFIX`: Console output prefix for logic-map messages.
    *   `MODEL_PATH`: Defines the path where the TensorFlow.js model is saved/loaded.
    *   `RESET`: Console escape code for resetting text formatting.
    *   `USER_PREFIX`: Console output prefix for user input prompts.
    *   `model`: A global variable to store the loaded or trained TensorFlow.js model.
    *   `rl`: The readline interface instance for user interaction.

#### 4.2. Wiki Synchronization Script (`sync-wiki.mjs`)

*   **Entry Point**: `node --env-file=.env sync-wiki.mjs` or `npm run update` (requires `GEMINI_API_KEY` to be set in a `.env` file).
*   **Main Functions/Flows**:
    *   `runWikiEngine()`: The primary asynchronous function that orchestrates the entire wiki generation and update process.
    *   **Initialization Phase (if `.wiki` directory or `wiki_state.json` is missing)**:
        *   Creates the `.wiki` directory.
        *   Executes `npx repomix --output codebase-snapshot.xml` to generate a comprehensive code bundle.
        *   Reads `codebase-snapshot.xml` and sends its content to the `gemini-2.5-flash` model via `@google/genai` to generate an initial markdown `index.md`.
        *   Saves the generated markdown to `.wiki/index.md`.
        *   Initializes `.wiki/wiki_state.json` with `version: 1.0` and `last_synced_commit` (current Git HEAD SHA).
        *   Deletes the temporary `codebase-snapshot.xml`.
    *   **Incremental Update Phase (if `.wiki` and `wiki_state.json` exist)**:
        *   Loads the `wiki_state.json` to retrieve `last_synced_commit`.
        *   Executes `git diff <last_synced_commit> HEAD` to obtain a diff of code changes.
        *   If `git diff` shows changes, it reads the current `.wiki/index.md` and sends both the `currentIndex` and the `gitDiff` to the `gemini-2.5-flash` model for an intelligent update.
        *   Overwrites `.wiki/index.md` with the AI-adjusted documentation.
        *   Updates `wiki_state.json` by advancing `last_synced_commit` to the current HEAD and incrementing the `version`.
*   **Helper Functions**:
    *   `cleanMarkdown(text)`: A utility function used to refine the AI-generated markdown text.
*   **Key Constants/Variables**:
    *   `ai`: An instance of `GoogleGenAI` used for API interactions.
    *   `initialState`: An object defined within `runWikiEngine` representing the initial state of `wiki_state.json`, including `version` and `last_synced_commit`.
    *   `last_synced_commit`: A property within the `initialState` object, tracking the last Git commit used for syncing.
    *   `version`: A property within the `initialState` object, indicating the version of the wiki state.

#### 4.3. Model Testing Script (`test_mapping.js`)

*   **Entry Point**: `node test_mapping.js`
*   **Main Functions/Flows**:
    *   `testModel()`: The main asynchronous function for testing.
    *   Loads the pre-trained TensorFlow.js model from `file://./my-logic-model/model.json`.
    *   Defines a hardcoded array of `testCases`, each with a binary `input` string and its `expected` binary `output` string.
    *   Iterates through each `testCase`:
        *   Converts the input string to a numerical array and then to a `tf.tensor2d`.
        *   Performs inference using `model.predict()`.
        *   Rounds the prediction output to binary (0 or 1) and converts it back to a binary string.
        *   Compares the predicted output with the `expected` output.
        *   Prints a tabular summary showing input, expected, predicted, and a match indicator (✓/✗).
    *   Provides a final summary indicating the number of correct mappings out of the total test cases.
*   **Key Functions**:
    *   `isNullOrUndefined`: A polyfill function defined within `test_mapping.js` (as `util.isNullOrUndefined`) for compatibility with Node.js v24.