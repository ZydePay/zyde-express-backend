// Import required modules
import express, { Request, Response } from 'express';
import { transferUSDC } from "./biconomy-gasless-with-viem";
import { transferUSDCEtherOption } from './biconomy-gasless-with-ethers';
// Create an instance of Express app
const app = express();
app.use(express.json())

// Define routes
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

app.post('/transferUSDC', async (req: Request, res:Response) => {
  try{
    const { amount, receipient, privateKey } = req.body;
    console.log(req.body)
    // Call the transferUSDC function with the provided parameters
    // and send the result back as the response
    const result = await transferUSDC(amount, receipient, privateKey);
    console.log("transactionHash", result)
    return res.json({transactionHash: result});
  }catch(error){
    console.log(error)
  }
 
});

app.post('/transferUSDCEtherOPtion', async (req: Request, res:Response) => {
  try{
    const { amount, receipient, privateKey } = req.body;
    console.log(req.body)
    // Call the transferUSDC function with the provided parameters
    // and send the result back as the response
    const result = await transferUSDCEtherOption(amount, receipient, privateKey);
    console.log("transactionHash", result)
    return res.json({transactionHash: result});
  }catch(error){
    console.log(error)
  }
});

// Start the server
const port = process.env.PORT || 10000;
app.listen(port,() => {
  console.log(`Server is running on port ${port}`);
});