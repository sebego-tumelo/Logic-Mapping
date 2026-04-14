const util = require("util");
util.isNullOrUndefined = util.isNullOrUndefined || function(x) { return x === null || x === undefined; };
const tf = require('@tensorflow/tfjs-node');
const readline = require('readline');
const fs = require('fs');

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
    const { xs, ys, inputShape, outputShape } = parseDataMap(dataString);

    model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [inputShape], units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: outputShape, activation: 'sigmoid' }));

    model.compile({
        optimizer: tf.train.adam(0.05),
        loss: 'meanSquaredError'
    });

    console.log('logic-map > Training....');
    await model.fit(xs, ys, { epochs: 200, verbose: 0 });
    
    await model.save(MODEL_PATH);
    console.log(`logic-map > Training Complete, model saved in ${MODEL_PATH}`);
    showMainMenu();
}

/**
 * Core Logic: Prediction (Inference)
 */
function runInference(inputStr) {
    if (!model) {
        console.log('logic-map > Error: No model loaded. Please train or load a model first.');
        return showMainMenu();
    }

    const inputArr = [inputStr.split('').map(Number)];
    const inputTensor = tf.tensor2d(inputArr);
    const prediction = model.predict(inputTensor);
    const result = prediction.round().dataSync().join('');
    
    console.log(`logic-map > output : ${result}`);
    askInference();
}

/**
 * Menu & Command Flows
 */
function showMainMenu() {
    console.log('\n--- logic-map > select one option ---');
    console.log('1. Load model');
    console.log('2. Train model');
    rl.question('user > ', handleMainMenu);
}

async function handleMainMenu(choice) {
    if (checkCommands(choice)) return;

    if (choice === '1') {
        try {
            model = await tf.loadLayersModel(`${MODEL_PATH}/model.json`);
            console.log('logic-map > Model loaded successfully.');
            askInference();
        } catch (err) {
            console.log('logic-map > Error: No saved model found. Please train one first.');
            showMainMenu();
        }
    } else if (choice === '2') {
        console.log('logic-map > enter data map (e.g., [000 - 1110, 001 - 0001])');
        rl.question('user > ', (data) => {
            if (checkCommands(data)) return;
            trainModel(data);
        });
    } else {
        console.log('logic-map > Invalid option.');
        showMainMenu();
    }
}

function askInference() {
    rl.question('logic-map > enter input (or /home) \nuser > ', (input) => {
        if (checkCommands(input)) return;
        runInference(input);
    });
}

/**
 * Global Command Handler
 */
function checkCommands(input) {
    const cmd = input.trim().toLowerCase();
    if (cmd === '/exit') {
        console.log('logic-map > shutting down...');
        process.exit();
    }
    if (cmd === '/home') {
        showMainMenu();
        return true;
    }
    if (cmd === '/help') {
        console.log('\n--- Commands ---');
        console.log('/home - Return to main menu');
        console.log('/help - Show this list');
        console.log('/exit - Close the program');
        console.log('----------------\n');
        return true;
    }
    return false;
}

// Start the program
console.log('Logic-Map CLI Loaded.');
showMainMenu();