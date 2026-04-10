const tf = require('@tensorflow/tfjs');

async function trainMappingModel() {
    // 1. Define the Dataset
    const inputData = [
        [0,0,0], [0,0,1], [0,1,0], [0,1,1],
        [1,0,0], [1,0,1], [1,1,0], [1,1,1]
    ];
    const outputData = [
        [1,1,1,0], [0,0,0,1], [1,0,0,1], [0,1,1,0],
        [0,1,0,0], [1,1,0,1], [0,0,1,0], [1,0,1,1]
    ];

    const xs = tf.tensor2d(inputData);
    const ys = tf.tensor2d(outputData);

    // 2. Build the Model
    const model = tf.sequential();
    
    // Hidden layer: 16 neurons often works well for small logic gates
    model.add(tf.layers.dense({
        inputShape: [3],
        units: 16,
        activation: 'relu'
    }));
    
    // Output layer: 4 units (one for each bit)
    // 'sigmoid' is best here because it forces values between 0 and 1
    model.add(tf.layers.dense({
        units: 4,
        activation: 'sigmoid'
    }));

    // 3. Compile the Model
    model.compile({
        optimizer: tf.train.adam(0.05), // Higher learning rate for small datasets
        loss: 'meanSquaredError'
    });

    // 4. Train the Model
    console.log('Training...');
    await model.fit(xs, ys, {
        epochs: 200,
        shuffle: true
    });
    console.log('Training Complete!');

    // 5. Test it with 011 (Expected: 0110)
    const testInput = tf.tensor2d([[0, 1, 1]]);
    const prediction = model.predict(testInput);
    
    // Round the results to get clean 0s and 1s
    prediction.round().print();
}

trainMappingModel();