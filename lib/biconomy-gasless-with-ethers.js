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
exports.transferUSDCEtherOption = void 0;
const ethers_1 = require("ethers");
const arc_gasless_1 = require("./arc-gasless");
const account_1 = require("@biconomy/account");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: "./.env" });
const USDCTokenAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC Proxy address
const zydeContractAddress = "0x581951B3CB2bB1a4e34D706173567caF19931Faa";
let receipientAddress = "0xF8a485A3c7F0497e5de4Dde26cbefc1465499251";
const bundlerUrl = process.env.BICONOMY_POLYGON_MAINNET_BUNDLER; // Found at https://dashboard.biconomy.io
const createSmartAccount = (privateKey) => __awaiter(void 0, void 0, void 0, function* () {
    // Your configuration with private key and Biconomy API key
    const config = {
        privateKey: privateKey,
        biconomyPaymasterApiKey: process.env.BICONOMY_API_KEY,
        bundlerUrl: bundlerUrl, // <-- Read about this at https://docs.biconomy.io/dashboard#bundler-url
        rpcUrl: process.env.ALCHEMY_MAINNET_URL,
    };
    // Generate EOA from private key using ethers.js
    let provider = new ethers_1.ethers.JsonRpcProvider(config.rpcUrl);
    let signer = new ethers_1.ethers.Wallet(config.privateKey, provider);
    // Create Biconomy Smart Account instance
    const smartWallet = yield (0, account_1.createSmartAccountClient)({
        signer,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        bundlerUrl: config.bundlerUrl,
    });
    const saAddress = yield smartWallet.getAccountAddress();
    console.log("SA Address", saAddress);
    return { smartWallet, saAddress };
});
const transferUSDCEtherOption = (amount, receipient) => __awaiter(void 0, void 0, void 0, function* () {
    // amount to approve and transfer
    const transferAmount = amount;
    const fee = transferAmount * 11 / 1000;
    console.log(fee);
    const totalApproveAmount = transferAmount + fee;
    const amountToTransfer = (0, ethers_1.parseUnits)(transferAmount.toString(), 6);
    const approvalAmount = (0, ethers_1.parseUnits)(totalApproveAmount.toString(), 6);
    // call the create smart contract function to get the smart account address
    const { smartWallet, saAddress } = yield createSmartAccount(process.env.PRIVATE_KEY);
    // call the gasless transfer to smart account function  
    // check gasless transfer to smart account transaction status 
    const res = yield (0, arc_gasless_1.checkTransactionStatus)(saAddress, amount, process.env.PRIVATE_KEY);
    console.log(res);
    if (!(res && res.data && res.data.txStatus === "CONFIRMED")) {
        console.log("response from index", res);
        return console.log("transaction not yet confirmed, please wait a moment", res);
    }
    else {
        // batch transaction
        // USDC Approval Transaction
        const usdcAbi = new ethers_1.ethers.Interface(["function approve(address spender, uint256 amount)"]);
        const zydeAbi = new ethers_1.ethers.Interface(["function transferUSDC(address _recipient, uint256 _amount)"]);
        const usdcData = usdcAbi.encodeFunctionData("approve", [zydeContractAddress, approvalAmount]);
        console.log(receipient);
        const zydeData = zydeAbi.encodeFunctionData("transferUSDC", [receipient, amountToTransfer]);
        // Build the transaction
        const usdcApprovalTx = {
            to: USDCTokenAddress,
            data: usdcData,
        };
        // Build the transaction
        const zydeApprovalTx = {
            to: zydeContractAddress,
            data: zydeData,
        };
        // Send the transaction and get the transaction hash
        const userOpResponse = yield smartWallet.sendTransaction([usdcApprovalTx, zydeApprovalTx], {
            paymasterServiceData: { mode: account_1.PaymasterMode.SPONSORED },
        });
        const { transactionHash } = yield userOpResponse.waitForTxHash();
        console.log("Transaction Hash", transactionHash);
        const userOpReceipt = yield userOpResponse.wait();
        if (userOpReceipt.success == 'true') {
            console.log("UserOp receipt", userOpReceipt);
            console.log("Transaction receipt", userOpReceipt.receipt);
        }
        return transactionHash;
    }
});
exports.transferUSDCEtherOption = transferUSDCEtherOption;
