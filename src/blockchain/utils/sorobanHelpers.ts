import { xdr, nativeToScVal, scValToNative, Address } from '@stellar/stellar-sdk';

/**
 * Helper functions for Soroban contract interactions
 */

/**
 * Convert JavaScript values to ScVal for contract arguments
 */
export function toScVal(value: any): xdr.ScVal {
    return nativeToScVal(value);
}

/**
 * Convert ScVal to JavaScript native values
 */
export function fromScVal(scVal: xdr.ScVal): any {
    return scValToNative(scVal);
}

/**
 * Create address ScVal from string
 */
export function addressToScVal(address: string): xdr.ScVal {
    return new Address(address).toScVal();
}

/**
 * Convert number to u64 ScVal
 */
export function u64ToScVal(value: number | bigint): xdr.ScVal {
    return nativeToScVal(value, { type: 'u64' });
}

/**
 * Convert number to i64 ScVal
 */
export function i64ToScVal(value: number | bigint): xdr.ScVal {
    return nativeToScVal(value, { type: 'i64' });
}

/**
 * Convert number to u32 ScVal
 */
export function u32ToScVal(value: number): xdr.ScVal {
    return nativeToScVal(value, { type: 'u32' });
}

/**
 * Convert number to i32 ScVal
 */
export function i32ToScVal(value: number): xdr.ScVal {
    return nativeToScVal(value, { type: 'i32' });
}

/**
 * Convert string to symbol ScVal
 */
export function symbolToScVal(value: string): xdr.ScVal {
    return nativeToScVal(value, { type: 'symbol' });
}

/**
 * Convert boolean to ScVal
 */
export function boolToScVal(value: boolean): xdr.ScVal {
    return nativeToScVal(value);
}

/**
 * Convert bytes to ScVal
 */
export function bytesToScVal(value: Buffer): xdr.ScVal {
    return nativeToScVal(value, { type: 'bytes' });
}

/**
 * Parse error from contract invocation
 */
export function parseContractError(error: string): {
    type: string;
    message: string;
} {
    try {
        // Try to parse XDR error
        const errorXdr = xdr.TransactionResult.fromXDR(error, 'base64');
        return {
            type: 'XDR_ERROR',
            message: errorXdr.result().switch().name,
        };
    } catch {
        return {
            type: 'UNKNOWN_ERROR',
            message: error,
        };
    }
}

/**
 * Format stroops to XLM
 */
export function stroopsToXlm(stroops: string | number): string {
    const amount = typeof stroops === 'string' ? parseInt(stroops) : stroops;
    return (amount / 10000000).toFixed(7);
}

/**
 * Format XLM to stroops
 */
export function xlmToStroops(xlm: string | number): string {
    const amount = typeof xlm === 'string' ? parseFloat(xlm) : xlm;
    return Math.floor(amount * 10000000).toString();
}
