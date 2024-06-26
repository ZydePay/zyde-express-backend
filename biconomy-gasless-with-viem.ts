import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";
import { createSmartAccountClient, PaymasterMode } from "@biconomy/account";
import {
  Hex,
  createWalletClient,
  encodeFunctionData,
  http,
  parseAbi,
  parseUnits
} from "viem";
import { checkTransactionStatus } from "./arc-gasless"

import dotenv from "dotenv"
import { dataLength } from "ethers";
dotenv.config({path: "./.env"})

const USDCTokenAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" // USDC Proxy address
const zydeContractAddress = "0x581951B3CB2bB1a4e34D706173567caF19931Faa";
// let receipientAddress: string = "0xF8a485A3c7F0497e5de4Dde26cbefc1465499251"

const bundlerUrl = process.env.BICONOMY_POLYGON_MAINNET_BUNDLER as string // Found at https://dashboard.biconomy.io

export const createSmartAccount = async (privateKey: string) => {
  // Your configuration with private key and Biconomy API key
  const config = {
    privateKey: privateKey,
    biconomyPaymasterApiKey: process.env.BICONOMY_API_KEY as string,
    bundlerUrl: bundlerUrl, // <-- Read about this at https://docs.biconomy.io/dashboard#bundler-url
  };

  // Generate EOA from private key using ethers.js
  const account = privateKeyToAccount(`0x${privateKey}`);
  const client = createWalletClient({
    account,
    chain: polygon,
    transport: http(),
  });

  // Create Biconomy Smart Account instance
  const smartWallet = await createSmartAccountClient({
    signer: client,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
    bundlerUrl: config.bundlerUrl,
  });

  const saAddress = await smartWallet.getAccountAddress();
  console.log("SA Address", saAddress);
  return { smartWallet, saAddress }
};

export const transferUSDC = async (amount: number, receipient: string, privateKey: string) => {
   // amount to approve and transfer
   const transferAmount = amount
   const fee = transferAmount * 11/1000;
   console.log(fee)
   const totalApproveAmount = transferAmount + fee
 
   const amountToTransfer = parseUnits(transferAmount.toString(), 6);
   const approvalAmount = parseUnits(totalApproveAmount.toString(), 6)

   // call the create smart contract function to get the smart account address
  const {smartWallet, saAddress } = await createSmartAccount(privateKey)

  // call the gasless transfer to smart account function  
  // check gasless transfer to smart account transaction status 
  const res = await checkTransactionStatus(saAddress, transferAmount, privateKey)
  console.log(res)
  if (!(res && res.data && res.data.txStatus === "CONFIRMED")) {
    console.log("response from index", res);
    return console.log("transaction not yet confirmed, please wait a moment", res);
  }else{

  // batch transaction
  
  // USDC Approval Transaction
  const usdcAbi = parseAbi(["function approve(address spender, uint256 amount)"]);
  const zydeAbi = parseAbi(["function transferUSDC(address _recipient, uint256 _amount)"]);

  const usdcData = encodeFunctionData({
    abi: usdcAbi,
    functionName: "approve",
    args: [zydeContractAddress as Hex, approvalAmount],
  });

  const zydeData = encodeFunctionData({
    abi: zydeAbi,
    functionName: "transferUSDC",
    args: [receipient as Hex, amountToTransfer],
  });

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
const userOpResponse = await smartWallet.sendTransaction([usdcApprovalTx, zydeApprovalTx], {
  paymasterServiceData: {mode: PaymasterMode.SPONSORED},
});
const { transactionHash } = await userOpResponse.waitForTxHash();
console.log("Transaction Hash", transactionHash);
const userOpReceipt  = await userOpResponse.wait();
if(userOpReceipt.success == 'true') { 
  console.log("UserOp receipt", userOpReceipt)
  console.log("Transaction receipt", userOpReceipt.receipt)
}
return transactionHash
}
}

// transferUSDC()