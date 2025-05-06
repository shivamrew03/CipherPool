'use client'

import { useCurrentAccount } from '@mysten/dapp-kit'
import { SuiSignAndExecuteTransactionOutput } from '@mysten/wallet-standard'
import { Button, TextField, Tabs, Text, Card, Badge, Flex, Box } from '@radix-ui/themes'
import useTransact from '@suiware/kit/useTransact'
import { ChangeEvent, FC, MouseEvent, PropsWithChildren, useState, useEffect } from 'react'
import React from 'react'
import CustomConnectButton from '~~/components/CustomConnectButton'
import Loading from '~~/components/Loading'
import {
  CONTRACT_PACKAGE_VARIABLE_NAME,
  EXPLORER_URL_VARIABLE_NAME,
} from '~~/config/network'
import {
  prepareCreateShieldedPoolTransaction,
  prepareDepositTransaction,
  prepareTransferTransaction,
  prepareWithdrawTransaction,
  prepareGenerateViewingKeyTransaction,
} from '~~/dapp/helpers/transactions'
import { useShieldedPool } from '~~/dapp/hooks/useShieldedPool'
import {
  transactionUrl,
} from '~~/helpers/network'
import { notification } from '~~/helpers/notification'
import useNetworkConfig from '~~/hooks/useNetworkConfig'
import { Transaction } from '@mysten/sui/transactions'

const PrivateTransfersForm = () => {
  // State management
  const [amount, setAmount] = useState<string>('')
  const [recipient, setRecipient] = useState<string>('')
  const [viewingKeyName, setViewingKeyName] = useState<string>('')
  const [notificationId, setNotificationId] = useState<string>()
  const [poolId, setPoolId] = useState<string>('')
  
  // Hooks
  const currentAccount = useCurrentAccount()
  const { data, isPending, error, refetch } = useShieldedPool()
  const { useNetworkVariable, networkConfig } = useNetworkConfig()
  const packageId = useNetworkVariable(CONTRACT_PACKAGE_VARIABLE_NAME)
  const explorerUrl = useNetworkVariable(EXPLORER_URL_VARIABLE_NAME)

  // Log network info for debugging
  console.log('Current network config:', networkConfig);
  console.log('Using package ID:', packageId);
  console.log('Explorer URL:', explorerUrl);
  console.log('Current account:', currentAccount);

  // Transaction handlers
  const { transact: createPool } = useTransact({
    onBeforeStart: () => {
      const nId = notification.txLoading()
      setNotificationId(nId)
    },
    onSuccess: (data: SuiSignAndExecuteTransactionOutput) => {
      notification.txSuccess(
        transactionUrl(explorerUrl, data.digest),
        notificationId
      )
      refetch()
    },
    onError: (e: Error) => {
      notification.txError(e, null, notificationId)
    },
  })

  const { transact: deposit } = useTransact({
    onBeforeStart: () => {
      const nId = notification.txLoading()
      setNotificationId(nId)
    },
    onSuccess: (data: SuiSignAndExecuteTransactionOutput) => {
      notification.txSuccess(
        transactionUrl(explorerUrl, data.digest),
        notificationId
      )
      refetch()
      setAmount('')
    },
    onError: (e: Error) => {
      notification.txError(e, null, notificationId)
    },
  })

  const { transact: transfer } = useTransact({
    onBeforeStart: () => {
      const nId = notification.txLoading()
      setNotificationId(nId)
    },
    onSuccess: (data: SuiSignAndExecuteTransactionOutput) => {
      notification.txSuccess(
        transactionUrl(explorerUrl, data.digest),
        notificationId
      )
      refetch()
      setAmount('')
      setRecipient('')
    },
    onError: (e: Error) => {
      notification.txError(e, null, notificationId)
    },
  })

  const { transact: withdraw } = useTransact({
    onBeforeStart: () => {
      const nId = notification.txLoading()
      setNotificationId(nId)
    },
    onSuccess: (data: SuiSignAndExecuteTransactionOutput) => {
      notification.txSuccess(
        transactionUrl(explorerUrl, data.digest),
        notificationId
      )
      refetch()
      setAmount('')
      setRecipient('')
    },
    onError: (e: Error) => {
      notification.txError(e, null, notificationId)
    },
  })

  const { transact: generateViewingKey } = useTransact({
    onBeforeStart: () => {
      const nId = notification.txLoading()
      setNotificationId(nId)
    },
    onSuccess: (data: SuiSignAndExecuteTransactionOutput) => {
      notification.txSuccess(
        transactionUrl(explorerUrl, data.digest),
        notificationId
      )
      refetch()
      setViewingKeyName('')
    },
    onError: (e: Error) => {
      notification.txError(e, null, notificationId)
    },
  })

  // Event handlers
  const handleCreatePoolClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    
    try {
      if (!packageId) {
        notification.error(null, 'Package ID is not defined or invalid')
        console.error('Package ID is undefined or invalid:', packageId)
        return
      }
      
      console.log('Attempting to create shielded pool with package ID:', packageId)
      
      const tx = prepareCreateShieldedPoolTransaction(packageId)
      console.log('Transaction prepared:', tx)
      
      // Execute the transaction
      await createPool(tx)
      console.log('Create pool transaction submitted successfully')
    } catch (error) {
      console.error("Error creating pool:", error)
      notification.error(null, 'Failed to create pool: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setAmount(e.target.value)
  }

  const handleRecipientChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setRecipient(e.target.value)
  }

  const handleViewingKeyNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setViewingKeyName(e.target.value)
  }

  const handlePoolIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setPoolId(e.target.value)
  }

  const handleDeposit = (poolId: string | null | undefined) => {
    if (poolId == null) {
      notification.error(null, 'Pool ID is not valid')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      notification.error(null, 'Amount must be greater than 0')
      return
    }

    if (!packageId) {
      notification.error(null, 'Package ID is not defined')
      return
    }

    // Generate a random commitment
    const commitment = generateRandomBytes(32)
    
    const tx = prepareDepositTransaction(
      packageId,
      poolId,
      parseFloat(amount),
      commitment
    )
    
    deposit(tx)
  }

  const handleTransfer = (poolId: string | null | undefined) => {
    if (poolId == null) {
      notification.error(null, 'Pool ID is not valid')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      notification.error(null, 'Amount must be greater than 0')
      return
    }
    
    if (!recipient) {
      notification.error(null, 'Recipient address is required')
      return
    }

    if (!packageId) {
      notification.error(null, 'Package ID is not defined')
      return
    }

    // In a real implementation, these would be generated based on proper ZK proofs
    const nullifier = generateRandomBytes(32)
    const newCommitment = generateRandomBytes(32)
    const proof = generateRandomBytes(128)
    const merkleRoot = generateRandomBytes(32)
    
    const tx = prepareTransferTransaction(
      packageId,
      poolId,
      nullifier,
      newCommitment,
      proof,
      merkleRoot
    )
    
    transfer(tx)
  }
  
  const handleWithdraw = (poolId: string | null | undefined) => {
    if (poolId == null) {
      notification.error(null, 'Pool ID is not valid')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      notification.error(null, 'Amount must be greater than 0')
      return
    }
    
    if (!recipient) {
      notification.error(null, 'Recipient address is required')
      return
    }

    if (!packageId) {
      notification.error(null, 'Package ID is not defined')
      return
    }

    // In a real implementation, these would be generated based on proper ZK proofs
    const nullifier = generateRandomBytes(32)
    const proof = generateRandomBytes(128)
    const merkleRoot = generateRandomBytes(32)
    
    const tx = prepareWithdrawTransaction(
      packageId,
      poolId,
      nullifier,
      recipient,
      parseFloat(amount),
      proof,
      merkleRoot
    )
    
    withdraw(tx)
  }
  
  const handleGenerateViewingKey = (poolId: string | null | undefined) => {
    if (poolId == null) {
      notification.error(null, 'Pool ID is not valid')
      return
    }
    
    if (!viewingKeyName) {
      notification.error(null, 'Viewing key name is required')
      return
    }

    if (!packageId) {
      notification.error(null, 'Package ID is not defined')
      return
    }

    // Generate random key bytes
    const keyBytes = generateRandomBytes(32)
    
    const tx = prepareGenerateViewingKeyTransaction(
      packageId,
      poolId,
      keyBytes,
      viewingKeyName
    )
    
    generateViewingKey(tx)
  }

  // Helper function to generate random bytes (mock function)
  const generateRandomBytes = (length: number): Uint8Array => {
    const bytes = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
    return bytes
  }

  if (currentAccount == null) return <CustomConnectButton />

  if (isPending)
    return (
      <Flex justify="center" py="4">
        <Loading />
      </Flex>
    )

  if (error) return <TextMessage>Error: {error.message}</TextMessage>

  return (
    <Card className="max-w-md mx-auto">
      <Tabs.Root defaultValue="create">
        <Tabs.List>
          <Tabs.Trigger value="create">Create Pool</Tabs.Trigger>
          <Tabs.Trigger value="deposit">Deposit</Tabs.Trigger>
          <Tabs.Trigger value="transfer">Transfer</Tabs.Trigger>
          <Tabs.Trigger value="withdraw">Withdraw</Tabs.Trigger>
          <Tabs.Trigger value="viewingKey">Viewing Key</Tabs.Trigger>
        </Tabs.List>

        {!currentAccount ? (
          <div className="mt-4 text-center text-red-500">
            Please connect your wallet first
          </div>
        ) : (
          <>
            <Tabs.Content value="create">
              <Flex direction="column" gap="3">
                <Button 
                  variant="solid" 
                  onClick={handleCreatePoolClick}
                >
                  Create Shielded Pool
                </Button>
              </Flex>
            </Tabs.Content>

            <Tabs.Content value="deposit">
              <Flex direction="column" gap="3">
                <TextField.Root
                  size="3"
                  placeholder="Amount to deposit"
                  value={amount}
                  onChange={handleAmountChange}
                />
                <Button 
                  variant="solid" 
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault()
                    handleDeposit(poolId)
                  }}
                >
                  Deposit
                </Button>
              </Flex>
            </Tabs.Content>
            
            <Tabs.Content value="transfer">
              <Flex direction="column" gap="3">
                <TextField.Root
                  size="3"
                  placeholder="Amount to transfer"
                  value={amount}
                  onChange={handleAmountChange}
                />
                <TextField.Root
                  size="3"
                  placeholder="Recipient address"
                  value={recipient}
                  onChange={handleRecipientChange}
                />
                <Button 
                  variant="solid" 
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault()
                    handleTransfer(poolId)
                  }}
                >
                  Transfer Privately
                </Button>
              </Flex>
            </Tabs.Content>
            
            <Tabs.Content value="withdraw">
              <Flex direction="column" gap="3">
                <TextField.Root
                  size="3"
                  placeholder="Amount to withdraw"
                  value={amount}
                  onChange={handleAmountChange}
                />
                <TextField.Root
                  size="3"
                  placeholder="Recipient address"
                  value={recipient}
                  onChange={handleRecipientChange}
                />
                <Button 
                  variant="solid" 
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault()
                    handleWithdraw(poolId)
                  }}
                >
                  Withdraw
                </Button>
              </Flex>
            </Tabs.Content>
            
            <Tabs.Content value="viewingKey">
              <Flex direction="column" gap="3">
                <TextField.Root
                  size="3"
                  placeholder="Shielded Pool ID"
                  value={poolId}
                  onChange={handlePoolIdChange}
                />
                <TextField.Root
                  size="3"
                  placeholder="Viewing Key Name"
                  value={viewingKeyName}
                  onChange={handleViewingKeyNameChange}
                />
                <Button 
                  variant="solid" 
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault()
                    handleGenerateViewingKey(poolId)
                  }}
                >
                  Generate Viewing Key
                </Button>
              </Flex>
            </Tabs.Content>
          </>
        )}
        
        {data && data.length > 0 && (
          <Box mt="4" pt="3" style={{ borderTop: '1px solid var(--gray-5)' }}>
            <Flex gap="4" justify="between">
              <Text size="2">Total Deposits: <Badge>5.00 SUI</Badge></Text>
              <Text size="2">Balance: <Badge>5.00 SUI</Badge></Text>
            </Flex>
          </Box>
        )}
      </Tabs.Root>
    </Card>
  )
}

export default PrivateTransfersForm

const TextMessage: FC<PropsWithChildren> = ({ children }) => (
  <div className="text-center">{children}</div>
) 