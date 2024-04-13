"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import required modules
const express_1 = __importDefault(require("express"));
const biconomy_gasless_with_viem_1 = require("./biconomy-gasless-with-viem");
const biconomy_gasless_with_ethers_1 = require("./biconomy-gasless-with-ethers");
// Create an instance of Express app
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Define routes
app.get('/', (req, res) => {
    res.send('Hello, World!');
});
app.post('/transferUSDC', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount, receipient } = req.body;
        console.log(req.body);
        // Call the transferUSDC function with the provided parameters
        // and send the result back as the response
        const result = yield (0, biconomy_gasless_with_viem_1.transferUSDC)(amount, receipient);
        console.log("transactionHash", result);
        return res.json({ transactionHash: result });
    }
    catch (error) {
        console.log(error);
    }
}));
app.post('/transferUSDCEtherOPtion', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount, receipient } = req.body;
        console.log(req.body);
        // Call the transferUSDC function with the provided parameters
        // and send the result back as the response
        const result = yield (0, biconomy_gasless_with_ethers_1.transferUSDCEtherOption)(amount, receipient);
        console.log("transactionHash", result);
        return res.json({ transactionHash: result });
    }
    catch (error) {
        console.log(error);
    }
}));
// Start the server
const port = process.env.PORT || 10000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
