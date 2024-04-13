import { ethers, parseUnits } from "ethers";
import { checkTransactionStatus } from "./arc-gasless";
import { PaymasterMode, createSmartAccountClient } from "@biconomy/account";
import dotenv from "dotenv"
dotenv.config({path: "./.env"})

const USDCTokenAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" // USDC Proxy address
const zydeContractAddress = "0x581951B3CB2bB1a4e34D706173567caF19931Faa";
let receipientAddress: string = "0xF8a485A3c7F0497e5de4Dde26cbefc1465499251"

const bundlerUrl = process.env.BICONOMY_POLYGON_MAINNET_BUNDLER as string // Found at https://dashboard.biconomy.io

const createSmartAccount = async (privateKey: string) => {
    // Your configuration with private key and Biconomy API key
  const config = {
    privateKey: privateKey,
    biconomyPaymasterApiKey: process.env.BICONOMY_API_KEY as string,
    bundlerUrl: bundlerUrl, // <-- Read about this at https://docs.biconomy.io/dashboard#bundler-url
    rpcUrl: process.env.ALCHEMY_MAINNET_URL as string,
  };

  // Generate EOA from private key using ethers.js
  let provider = new ethers.JsonRpcProvider(config.rpcUrl);
  let signer = new ethers.Wallet(config.privateKey, provider);

  // Create Biconomy Smart Account instance
  const smartWallet = await createSmartAccountClient({
    signer,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
    bundlerUrl: config.bundlerUrl,
  });

  const saAddress = await smartWallet.getAccountAddress();
  console.log("SA Address", saAddress);
  return { smartWallet, saAddress }
}

export const transferUSDCEtherOption = async (amount: number, receipient: string, privateKey: string) => {
  // amount to approve and transfer
  const transferAmount = amount
  const fee = transferAmount * 11/1000;
  console.log(fee)
  const totalApproveAmount = transferAmount + fee

  const amountToTransfer = parseUnits(transferAmount.toString(), 6);
  const approvalAmount = parseUnits(totalApproveAmount.toString(), 6)
  // call the create smart contract function to get the smart account address
 const { smartWallet, saAddress } = await createSmartAccount(privateKey)

 // call the gasless transfer to smart account function  
 // check gasless transfer to smart account transaction status 
 const res = await checkTransactionStatus(saAddress, amount, privateKey)
 console.log(res)
 if (!(res && res.data && res.data.txStatus === "CONFIRMED")) {
   console.log("response from index", res);
   return console.log("transaction not yet confirmed, please wait a moment", res);
 }else{

 // batch transaction
 
 // USDC Approval Transaction
 const usdcAbi = new ethers.Interface(["function approve(address spender, uint256 amount)"]);
 const zydeAbi = new ethers.Interface(["function transferUSDC(address _recipient, uint256 _amount)"]);

 const usdcData = usdcAbi.encodeFunctionData(
   "approve",
   [zydeContractAddress, approvalAmount],
 );

 console.log(receipient)
 const zydeData = zydeAbi.encodeFunctionData(
   "transferUSDC",
   [receipient, amountToTransfer],
 );

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
