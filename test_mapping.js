const util = require("util");
util.isNullOrUndefined = util.isNullOrUndefined || function(x) { return x === null || x === undefined; };
const tf = require('@tensorflow/tfjs-node');

async function testModel() {
    try {
        const model = await tf.loadLayersModel('file://./my-logic-model/model.json');
        console.log('Model loaded successfully.\n');
        
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
        
        console.log('Testing Logic Mapping:');
        console.log('='.repeat(60));
        console.log('Input\tExpected\tGot\t\tMatch');
        console.log('-'.repeat(60));
        
        let matchCount = 0;
        
        for (const testCase of testCases) {
            const inputArr = [testCase.input.split('').map(Number)];
            const inputTensor = tf.tensor2d(inputArr);
            const prediction = model.predict(inputTensor);
            const output = prediction.round().dataSync().join('');
            
            const match = output === testCase.expected ? '✓' : '✗';
            if (output === testCase.expected) matchCount++;
            
            console.log(`${testCase.input}\t${testCase.expected}\t\t${output}\t\t${match}`);
        }
        
        console.log('-'.repeat(60));
        console.log(`\nResult: ${matchCount}/8 inputs mapped correctly`);
        
        if (matchCount === 8) {
            console.log('✓ All mappings are correct!');
        } else {
            console.log(`✗ ${8 - matchCount} mapping(s) are incorrect.`);
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

testModel();
