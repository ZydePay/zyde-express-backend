export declare const createSmartAccount: (privateKey: string) => Promise<{
    smartWallet: import("@biconomy/account").BiconomySmartAccountV2;
    saAddress: `0x${string}`;
}>;
export declare const transferUSDC: (amount: number, receipient: string) => Promise<string | void>;
