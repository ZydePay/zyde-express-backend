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
exports.checkTransactionStatus = exports.gaslessTransferToSmartAccount = void 0;
// import { ethers, Wallet } from "ethers"
const core_1 = require("@aarc-xyz/core");
const ethers_1 = require("ethers");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: "./.env" });
let aarcSDK = new core_1.AarcCore(process.env.ARC_API_KEY);
const gaslessTransferToSmartAccount = (smartAccountAddress, amount, privateKey) => __awaiter(void 0, void 0, void 0, function* () {
    const provider = new ethers_1.ethers.JsonRpcProvider(`${process.env.ALCHEMY_MAINNET_URL}`);
    const wallet = new ethers_1.Wallet(privateKey || "", provider);
    console.log("provider", provider);
    const PolygonUSDCTokenAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC Proxy address
    // Amount to transfer
    const transferAmount = amount;
    const platformFee = transferAmount * 11 / 1000;
    console.log(platformFee);
    const totalTransferAmount = transferAmount + platformFee;
    const signer = wallet.connect(provider);
    try {
        const res = yield aarcSDK.executeMigrationGasless({
            chainId: 137,
            senderSigner: signer,
            receiverAddress: smartAccountAddress,
            transferTokenDetails: [
                {
                    tokenAddress: PolygonUSDCTokenAddress,
                    // .toString(16) is to convert TOKEN_AMOUNT to hex in string format
                    amount: (0, ethers_1.parseUnits)(totalTransferAmount.toString(), 6).toString()
                },
            ],
        });
        const taskId = res[0].taskId;
        console.log('res', res);
        console.log('taskId', taskId);
        return res[0].taskId;
    }
    catch (error) {
        console.log(error);
    }
});
exports.gaslessTransferToSmartAccount = gaslessTransferToSmartAccount;
const checkTransactionStatus = (smartAccountAddress, amount, privateKey) => __awaiter(void 0, void 0, void 0, function* () {
    const taskId = yield (0, exports.gaslessTransferToSmartAccount)(smartAccountAddress, amount, privateKey);
    let transactionStatus;
    // Define a function to check transaction status
    const getStatus = () => __awaiter(void 0, void 0, void 0, function* () {
        transactionStatus = yield aarcSDK.getTransactionStatus(taskId);
        if (transactionStatus.data !== undefined &&
            transactionStatus.data.txStatus === "CONFIRMED") {
            // If the transaction is confirmed, return the status
            console.log('status', transactionStatus);
            return transactionStatus;
        }
        else {
            // If the transaction is not confirmed, recursively call getStatus
            return yield getStatus();
        }
    });
    // Call the getStatus function
    return yield getStatus();
});
exports.checkTransactionStatus = checkTransactionStatus;
