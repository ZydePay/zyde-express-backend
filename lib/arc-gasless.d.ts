export declare const gaslessTransferToSmartAccount: (smartAccountAddress: string, amount: number, privateKey: string) => Promise<string | undefined>;
export declare const checkTransactionStatus: (smartAccountAddress: string, amount: number, privateKey: string) => Promise<any>;
