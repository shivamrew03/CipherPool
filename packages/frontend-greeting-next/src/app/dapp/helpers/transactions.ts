import { Transaction } from '@mysten/sui/transactions'
import { fullFunctionName } from '~~/helpers/network'
import {
  TransactionObjectArgument,
  TransactionBlock,
} from '@mysten/sui.js/transactions'

export const prepareCreateGreetingTransaction = (
  packageId: string
): Transaction => {
  const tx = new Transaction()
  tx.moveCall({
    target: fullFunctionName(packageId, 'greeting', 'create'),
  })
  return tx
}

export const prepareSetGreetingTransaction = (
  packageId: string,
  objectId: string,
  name: string
): Transaction => {
  const tx = new Transaction()
  tx.moveCall({
    target: fullFunctionName(packageId, 'greeting', 'set_greeting'),
    arguments: [tx.object(objectId), tx.pure(name)],
  })
  return tx
}

export const prepareResetGreetingTransaction = (
  packageId: string,
  objectId: string
): Transaction => {
  const tx = new Transaction()
  tx.moveCall({
    target: fullFunctionName(packageId, 'greeting', 'reset_greeting'),
    arguments: [tx.object(objectId)],
  })
  return tx
}

/**
 * Prepares a transaction to create a shielded pool
 */
export const prepareCreateShieldedPoolTransaction = (
  packageId: string
): Transaction => {
  const tx = new Transaction()
  
  console.log('Creating shielded pool with package ID:', packageId);
  
  // Match the actual module structure from the contract
  tx.moveCall({
    target: `${packageId}::shielded_pool::create`,
    typeArguments: ['0x2::sui::SUI'],
  })
  
  return tx
}

/**
 * Prepares a transaction to deposit SUI into a shielded pool
 */
export function prepareDepositTransaction(
  packageId: string,
  poolId: string,
  amount: number,
  commitment: Uint8Array
): TransactionBlock {
  const tx = new TransactionBlock();
  
  // Convert SUI amount to MIST (1 SUI = 10^9 MIST)
  const amountMist = Math.floor(amount * 1_000_000_000);
  
  // Split coin to get exact amount
  const [coin] = tx.splitCoins(tx.gas, [tx.pure(amountMist)]);
  
  // Call deposit function from the package
  tx.moveCall({
    target: `${packageId}::shielded_pool::deposit`,
    arguments: [
      tx.object(poolId),
      coin,
      tx.pure(Array.from(commitment))
    ],
  });
  
  return tx;
}

/**
 * Prepares a transaction to transfer SUI within a shielded pool
 */
export function prepareTransferTransaction(
  packageId: string,
  poolId: string,
  nullifier: Uint8Array,
  newCommitment: Uint8Array,
  proof: Uint8Array,
  merkleRoot: Uint8Array
): TransactionBlock {
  const tx = new TransactionBlock();
  
  // Call transfer function from the package
  tx.moveCall({
    target: `${packageId}::shielded_pool::transfer`,
    arguments: [
      tx.object(poolId),
      tx.pure(Array.from(nullifier)),
      tx.pure(Array.from(newCommitment)),
      tx.pure(Array.from(proof)),
      tx.pure(Array.from(merkleRoot))
    ],
  });
  
  return tx;
}

/**
 * Prepares a transaction to withdraw SUI from a shielded pool
 */
export function prepareWithdrawTransaction(
  packageId: string,
  poolId: string,
  nullifier: Uint8Array,
  recipientAddress: string,
  amount: number,
  proof: Uint8Array,
  merkleRoot: Uint8Array
): TransactionBlock {
  const tx = new TransactionBlock();
  
  // Convert SUI amount to MIST (1 SUI = 10^9 MIST)
  const amountMist = Math.floor(amount * 1_000_000_000);
  
  // Call withdraw function from the package
  tx.moveCall({
    target: `${packageId}::shielded_pool::withdraw`,
    arguments: [
      tx.object(poolId),
      tx.pure(Array.from(nullifier)),
      tx.pure(recipientAddress),
      tx.pure(amountMist),
      tx.pure(Array.from(proof)),
      tx.pure(Array.from(merkleRoot))
    ],
  });
  
  return tx;
}

/**
 * Prepares a transaction to generate a viewing key for a shielded pool
 */
export function prepareGenerateViewingKeyTransaction(
  packageId: string,
  poolId: string,
  keyBytes: Uint8Array,
  keyName: string
): TransactionBlock {
  const tx = new TransactionBlock();
  
  // Call generate_viewing_key function from the package
  tx.moveCall({
    target: `${packageId}::shielded_pool::generate_viewing_key`,
    arguments: [
      tx.object(poolId),
      tx.pure(Array.from(keyBytes)),
      tx.pure(keyName)
    ],
  });
  
  return tx;
}
