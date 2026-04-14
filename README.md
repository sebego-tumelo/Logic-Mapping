# Logic-Mapping

Logic Mapping using TensorFlow.js. This application trains a neural network to learn binary logic mappings and perform predictions based on trained data.

## Description

The Logic-Mapping app is a command-line interface (CLI) tool that uses TensorFlow.js to train a simple neural network on binary input-output pairs. Once trained, the model can predict outputs for new binary inputs. It's designed for learning and experimenting with basic logic functions or mappings.

### How It Works

1. **Training**: Provide a dataset of binary input-output pairs (e.g., `[000 - 1110, 001 - 0001]`). The app parses this into tensors, builds a sequential neural network with dense layers, and trains it using mean squared error loss and Adam optimizer.
2. **Inference**: After loading a trained model, enter binary inputs to get predicted outputs.
3. **Model Saving/Loading**: Trained models are saved to the `my-logic-model/` directory in TensorFlow.js format.

The neural network architecture:
- Input layer: Dense with units equal to input length, ReLU activation.
- Hidden layer: Dense with 16 units, ReLU activation.
- Output layer: Dense with units equal to output length, sigmoid activation.

## Installation

1. Ensure you have Node.js installed (recommended: v20 or v22 for compatibility; v24 requires a polyfill).
2. Clone the repository:
   ```
   git clone https://github.com/sebego-tumelo/Logic-Mapping.git
   cd Logic-Mapping
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage

Run the application:
```
npm start
# or
node index.js
```

### Navigation

The app presents a menu with options:

- **1. Load model**: Load a previously trained model from `my-logic-model/`. If no model exists, you'll be prompted to train one first.
- **2. Train model**: Enter training data and train a new model.

After loading a model or training, you'll enter inference mode to predict outputs.

### Input Requirements

- **Training Data**: A string in the format `[input1 - output1, input2 - output2, ...]`, where inputs and outputs are binary strings (e.g., `000`, `1110`).
  - Inputs and outputs must consist only of `0`s and `1`s.
  - All inputs must have the same length; all outputs must have the same length.
  - Example: `[000 - 1110, 001 - 0001, 010 - 1010]`
- **Inference Input**: A single binary string matching the trained input length (e.g., `000`).

### Example Workflow

1. Start the app: `node index.js`
2. Choose `2` to train.
3. Enter data: `[000 - 1110, 001 - 0001]`
4. Wait for training to complete.
5. Choose `1` to load the model (or it loads automatically after training).
6. Enter an input like `000` to get a prediction.

## Compatibility

- Node.js v20+ recommended. For Node.js v24, a polyfill is included in `index.js` to handle deprecated `util.isNullOrUndefined`.
- Uses `@tensorflow/tfjs-node` for optimized performance.

## License

ISC
