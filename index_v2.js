// 1. Mute the C++ CPU optimization logs
process.env['TF_CPP_MIN_LOG_LEVEL'] = '2';

// 2. Mute the Node.js deprecation warnings (url.parse)
process.removeAllListeners('warning');

const util = require("util");
util.isNullOrUndefined = util.isNullOrUndefined || function(x) { return x === null || x === undefined; };
const tf = require('@tensorflow/tfjs-node');
const readline = require('readline');
const fs = require('fs');

const LOGIC_PREFIX = '\x1b[96mlogic-map >';
const USER_PREFIX = '\x1b[95muser >';
const RESET = '\x1b[0m';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

let model = null;
const MODEL_PATH = 'file://./my-logic-model';

/**
 * Utility to parse the user's data map string into Tensors
 * Format: [000 - 1110, 001 - 0001]
 */
function parseDataMap(inputString) {
    const pairs = inputString.replace(/[\[\]]/g, '').split(',');
    const inputs = [];
    const outputs = [];

    pairs.forEach(pair => {
        const [inStr, outStr] = pair.split('-').map(s => s.trim());
        if (inStr && outStr) {
            inputs.push(inStr.split('').map(Number));
            outputs.push(outStr.split('').map(Number));
        }
    });

    if (inputs.length === 0 || outputs.length === 0) {
        throw new Error('Empty or unparseable vector maps.');
    }

    return {
        xs: tf.tensor2d(inputs),
        ys: tf.tensor2d(outputs),
        inputShape: inputs[0].length,
        outputShape: outputs[0].length
    };
}

/**
 * Core Logic: Training the Neural Network
 */
async function trainModel(dataString) {
    try {
        const { xs, ys, inputShape, outputShape } = parseDataMap(dataString);

        model = tf.sequential();
        model.add(tf.layers.dense({ inputShape: [inputShape], units: 32, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
        model.add(tf.layers.dense({ units: outputShape, activation: 'sigmoid' }));

        model.compile({
            optimizer: tf.train.adam(0.01),
            loss: 'binaryCrossentropy'
        });

        console.log(`${LOGIC_PREFIX} Training....${RESET}`);
        await model.fit(xs, ys, { epochs: 200, verbose: 0 });
        
        // Clean memory metrics instantly to stabilize Codespace resources
        xs.dispose();
        ys.dispose();
        
        await model.save(MODEL_PATH);
        console.log(`${LOGIC_PREFIX} Training Complete, model saved in ${MODEL_PATH}${RESET}`);
        
        // Use setTimeout to clear execution stack lines safely
        setTimeout(showMainMenu, 0);
    } catch (err) {
        console.log(`${LOGIC_PREFIX} Error: Invalid data format. Please use format: [000 - 1110, 001 - 0001]${RESET}`);
        console.log(`${LOGIC_PREFIX} Type /help for more information.${RESET}`);
        setTimeout(showMainMenu, 0);
    }
}

/**
 * Core Logic: Prediction (Inference)
 */
function runInference(inputStr) {
    if (!model) {
        console.log(`${LOGIC_PREFIX} Error: No model loaded. Please train or load a model first.${RESET}`);
        return setTimeout(showMainMenu, 0);
    }

    try {
        if (!/^[01]+$/.test(inputStr.trim())) {
            throw new Error('Input must contain only 0s and 1s.');
        }

        const inputArr = [inputStr.trim().split('').map(Number)];
        const expectedInputShape = model.inputs[0].shape[1];
        
        if (inputArr[0].length !== expectedInputShape) {
            throw new Error(`Dimension mismatch. Expected exactly ${expectedInputShape} bits.`);
        }

        const inputTensor = tf.tensor2d(inputArr);
        const prediction = model.predict(inputTensor);
        const result = prediction.round().dataSync().join('');
        
        console.log(`${LOGIC_PREFIX} output : ${result}${RESET}`);
        
        inputTensor.dispose();
        prediction.dispose();
        
        setTimeout(askInference, 0);
    } catch (err) {
        console.log(`${LOGIC_PREFIX} Error: ${err.message}${RESET}`);
        console.log(`${LOGIC_PREFIX} Type /help for more information.${RESET}`);
        setTimeout(askInference, 0);
    }
}

/**
 * Menu & Command Flows
 */
function showMainMenu() {
    console.log(`\n${LOGIC_PREFIX} --- select one option ---${RESET}`);
    console.log('1. Load model');
    console.log('2. Train model');
    rl.question(`${USER_PREFIX} `, (choice) => {
        const cmd = choice.trim().toLowerCase();
        if (cmd === '/help') return enterHelpMode(showMainMenu);
        if (checkCommands(choice)) return;
        handleMainMenu(choice);
    });
}

function promptForTrainingData() {
    console.log(`${LOGIC_PREFIX} enter data map (e.g., [000 - 1110, 001 - 0001])${RESET}`);
    rl.question(`${USER_PREFIX} `, (data) => {
        const dataCmd = data.trim().toLowerCase();
        if (dataCmd === '/help') return enterHelpMode(promptForTrainingData);
        if (checkCommands(data)) return;
        trainModel(data);
    });
}

async function handleMainMenu(choice) {
    const selection = choice.trim();

    if (selection === '1') {
        try {
            model = await tf.loadLayersModel(`${MODEL_PATH}/model.json`);
            console.log(`${LOGIC_PREFIX} Model loaded successfully.${RESET}`);
            setTimeout(askInference, 0);
        } catch (err) {
            console.log(`${LOGIC_PREFIX} Error: No saved model found. Please train one first.${RESET}`);
            setTimeout(showMainMenu, 0);
        }
    } else if (selection === '2') {
        promptForTrainingData();
    } else {
        console.log(`${LOGIC_PREFIX} Invalid option. Please enter 1 or 2.${RESET}`);
        console.log(`${LOGIC_PREFIX} Type /help for more information.${RESET}`);
        setTimeout(showMainMenu, 0);
    }
}

function askInference() {
    rl.question(`${LOGIC_PREFIX} enter input (or /home) ${RESET}\n${USER_PREFIX} `, (input) => {
        const cmd = input.trim().toLowerCase();
        if (cmd === '/help') return enterHelpMode(askInference);
        if (checkCommands(input)) return;
        runInference(input);
    });
}

/**
 * Help Mode - Display help and wait for commands
 */
function enterHelpMode(returnCallback) {
    console.log('\n--- Commands ---');
    console.log('/home - Return to main menu');
    console.log('/help - Show this list');
    console.log('/exit - Close the program');
    console.log('----------------\n');
    
    rl.question(`${USER_PREFIX} `, (input) => {
        const cmd = input.trim().toLowerCase();
        
        if (cmd === '/help') {
            return enterHelpMode(returnCallback);
        }
        if (cmd === '/exit') {
            console.log(`${LOGIC_PREFIX} shutting down...${RESET}`);
            rl.close();
            process.exit(0);
        }
        if (cmd === '/home') {
            return setTimeout(showMainMenu, 0);
        }
        
        console.log(`${LOGIC_PREFIX} Invalid command.${RESET}`);
        enterHelpMode(returnCallback);
    });
}

/**
 * Global Command Handler
 */
function checkCommands(input) {
    const cmd = input.trim().toLowerCase();
    if (cmd === '/exit') {
        console.log(`${LOGIC_PREFIX} shutting down...${RESET}`);
        rl.close();
        process.exit(0);
    }
    if (cmd === '/home') {
        setTimeout(showMainMenu, 0);
        return true;
    }
    return false;
}

// Start the program
console.log('Logic-Map CLI Loaded.');
showMainMenu();