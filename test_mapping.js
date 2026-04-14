// Polyfill for util.isNullOrUndefined which is missing in Node.js 24
// This ensures compatibility with TensorFlow.js
const util = require("util");
util.isNullOrUndefined = util.isNullOrUndefined || function(x) { return x === null || x === undefined; };

// Import TensorFlow.js Node backend for model loading and inference
const tf = require('@tensorflow/tfjs-node');

// Main testing function - loads the trained model and tests all input-output pairs
async function testModel() {
    try {
        // Load the trained model from the saved file
        // 'file://./my-logic-model/model.json' points to the saved model directory
        const model = await tf.loadLayersModel('file://./my-logic-model/model.json');
        console.log('Model loaded successfully.\n');
        
        // Define all test cases with input strings and their expected outputs
        // Each input is a 3-bit binary string, each output is a 4-bit binary string
        const testCases = [
            { input: '000', expected: '0010' },
            { input: '001', expected: '0101' },
            { input: '010', expected: '1010' },
            { input: '011', expected: '1111' },
            { input: '100', expected: '1001' },
            { input: '101', expected: '0111' },
            { input: '110', expected: '1101' },
            { input: '111', expected: '0001' }
        ];
        
        // Display test header
        console.log('Testing Logic Mapping:');
        console.log('='.repeat(60));
        console.log('Input\tExpected\tGot\t\tMatch');
        console.log('-'.repeat(60));
        
        // Counter for correct predictions
        let matchCount = 0;
        
        // Test each input-output pair
        for (const testCase of testCases) {
            // Convert input string to array of numbers (e.g., '000' -> [0, 0, 0])
            // Wrap in array because TensorFlow expects batch dimension
            const inputArr = [testCase.input.split('').map(Number)];
            
            // Create 2D tensor from the input array
            // Shape will be [1, 3] - 1 sample with 3 features
            const inputTensor = tf.tensor2d(inputArr);
            
            // Run inference - get model prediction for this input
            const prediction = model.predict(inputTensor);
            
            // Convert prediction tensor to binary string
            // .round() converts sigmoid outputs to 0 or 1
            // .dataSync() gets the actual values as a typed array
            // .join('') converts array to string
            const output = prediction.round().dataSync().join('');
            
            // Check if prediction matches expected output
            const match = output === testCase.expected ? '✓' : '✗';
            if (output === testCase.expected) matchCount++;
            
            // Display results in tabular format
            console.log(`${testCase.input}\t${testCase.expected}\t\t${output}\t\t${match}`);
        }
        
        // Display test summary
        console.log('-'.repeat(60));
        console.log(`\nResult: ${matchCount}/8 inputs mapped correctly`);
        
        // Final assessment
        if (matchCount === 8) {
            console.log('✓ All mappings are correct!');
        } else {
            console.log(`✗ ${8 - matchCount} mapping(s) are incorrect.`);
        }
        
        // Exit successfully
        process.exit(0);
    } catch (err) {
        // Handle any errors (e.g., model not found, invalid data)
        console.error('Error:', err.message);
        process.exit(1);
    }
}

// Start the testing process
testModel();
