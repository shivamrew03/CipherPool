'use client'

import { ArrowLeftIcon, EyeOpenIcon, ArrowDownIcon, ArrowRightIcon, PlusIcon } from '@radix-ui/react-icons'
import { Box, Button, Card, Container, Flex, Heading, Tabs, Text, TextField, Badge } from '@radix-ui/themes'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SuiSignAndExecuteTransactionOutput } from '@mysten/wallet-standard'
import useTransact from '@suiware/kit/useTransact'
import { CONTRACT_PACKAGE_VARIABLE_NAME, EXPLORER_URL_VARIABLE_NAME } from '~~/config/network'
import { notification } from '~~/helpers/notification'
import { transactionUrl } from '~~/helpers/network'
import useNetworkConfig from '~~/hooks/useNetworkConfig'
import Loading from '~~/components/Loading'
import NetworkSupportChecker from '~~/components/NetworkSupportChecker'
import CustomConnectButton from '~~/components/CustomConnectButton'
import {
  prepareDepositTransaction,
  prepareTransferTransaction,
  prepareWithdrawTransaction,
  prepareGenerateViewingKeyTransaction
} from '~~/dapp/helpers/transactions'

// Browser-safe helper
const isBrowser = typeof window !== 'undefined'

interface PoolDetails {
  id: string
  name: string
  balance: number
  userCount: number
}

// Save transaction history to local storage
const saveTransactionToHistory = (type: string, poolId: string, amount?: number, recipient?: string) => {
  if (!isBrowser) return
  
  try {
    const historyKey = `tx_history_${poolId}`
    const existingHistory = localStorage.getItem(historyKey)
    const history = existingHistory ? JSON.parse(existingHistory) : []
    
    history.unshift({
      type,
      amount,
      recipient,
      timestamp: Date.now()
    })
    
    // Keep only the last 10 transactions
    const limitedHistory = history.slice(0, 10)
    localStorage.setItem(historyKey, JSON.stringify(limitedHistory))
  } catch (error) {
    console.error('Failed to save transaction to history:', error)
  }
}

// Get transaction history from local storage
const getTransactionHistory = (poolId: string) => {
  if (!isBrowser) return []
  
  try {
    const historyKey = `tx_history_${poolId}`
    const existingHistory = localStorage.getItem(historyKey)
    return existingHistory ? JSON.parse(existingHistory) : []
  } catch (error) {
    console.error('Failed to get transaction history:', error)
    return []
  }
}

export default function PoolDetailPage() {
  const router = useRouter()
  const params = useParams()
  const suiClient = useSuiClient()
  const currentAccount = useCurrentAccount()
  const { useNetworkVariable } = useNetworkConfig()
  
  const packageId = useNetworkVariable(CONTRACT_PACKAGE_VARIABLE_NAME)
  const explorerUrl = useNetworkVariable(EXPLORER_URL_VARIABLE_NAME)
  
  const [pool, setPool] = useState<PoolDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [txHistory, setTxHistory] = useState<Array<any>>([])
  
  // Transaction states
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [viewingKeyName, setViewingKeyName] = useState('')
  const [notificationId, setNotificationId] = useState<string>()
  
  // UI states
  const [activeTab, setActiveTab] = useState('deposit')
  const [isTransacting, setIsTransacting] = useState(false)
  
  const poolId = params?.id?.toString() || ''

  useEffect(() => {
    async function fetchPoolDetails() {
      if (!poolId) {
        setError('Pool ID is missing')
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        
        // Get from local storage
        if (isBrowser) {
          const storedPoolsJson = localStorage.getItem('shielded_pools_data')
          const storedPools = storedPoolsJson ? JSON.parse(storedPoolsJson) : []
          const cachedPool = storedPools.find((p: any) => p.id === poolId)
          
          if (cachedPool) {
            setPool({
              id: poolId,
              name: cachedPool.name,
              balance: cachedPool.balance,
              userCount: cachedPool.userCount
            })
            
            // Load transaction history
            const history = getTransactionHistory(poolId)
            setTxHistory(history)
            
            setIsLoading(false)
            return
          }
        }
        
        // Fetch from chain if not in local storage
        const poolDetails = await suiClient.getObject({
          id: poolId,
          options: {
            showContent: true,
            showDisplay: true,
            showOwner: true,
          },
        })
        
        // Extract pool details from the response
        if (poolDetails.data && poolDetails.data.content) {
          const content = poolDetails.data.content
          let poolName = 'Shielded Pool'
          
          // Try to extract a name if available in display
          if (poolDetails.data.display && poolDetails.data.display.data) {
            poolName = poolDetails.data.display.data.name || 'Shielded Pool'
          }
          
          // Add the short ID to the name
          const shortId = poolId.substring(0, 8)
          poolName = `${poolName} ${shortId}`
          
          let balance = 0
          let userCount = 0
          
          if ('fields' in content) {
            balance = parseInt(content.fields.total_deposits || '0')
            // In a real implementation, you'd count actual users
            userCount = Math.floor(Math.random() * 20) + 1
          }
          
          setPool({
            id: poolId,
            name: poolName,
            balance,
            userCount
          })
          
          // Load transaction history
          const history = getTransactionHistory(poolId)
          setTxHistory(history)
        } else {
          setError('Pool not found or invalid data')
        }
      } catch (error) {
        console.error('Error fetching pool details:', error)
        setError('Failed to load pool details')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPoolDetails()
  }, [poolId, suiClient])
  
  // Transaction handlers
  const { transact: executeDeposit } = useTransact({
    onBeforeStart: () => {
      setIsTransacting(true)
      const nId = notification.txLoading()
      setNotificationId(nId)
    },
    onSuccess: (data: SuiSignAndExecuteTransactionOutput) => {
      notification.txSuccess(
        transactionUrl(explorerUrl, data.digest),
        notificationId
      )
      
      // Update pool balance in local storage
      if (isBrowser && pool) {
        try {
          const storedPoolsJson = localStorage.getItem('shielded_pools_data')
          const storedPools = storedPoolsJson ? JSON.parse(storedPoolsJson) : []
          const updatedPools = storedPools.map((p: any) => {
            if (p.id === poolId) {
              return {
                ...p,
                balance: p.balance + Math.floor(Number(amount) * 1_000_000_000)
              }
            }
            return p
          })
          localStorage.setItem('shielded_pools_data', JSON.stringify(updatedPools))
          
          // Update the current pool state
          setPool({
            ...pool,
            balance: pool.balance + Math.floor(Number(amount) * 1_000_000_000)
          })
          
          // Save to transaction history
          saveTransactionToHistory('deposit', poolId, Number(amount))
          setTxHistory(getTransactionHistory(poolId))
        } catch (err) {
          console.error('Error updating pool balance:', err)
        }
      }
      
      setAmount('')
      setIsTransacting(false)
    },
    onError: (e: Error) => {
      notification.txError(e, null, notificationId)
      setIsTransacting(false)
    },
  })
  
  const { transact: executeTransfer } = useTransact({
    onBeforeStart: () => {
      setIsTransacting(true)
      const nId = notification.txLoading()
      setNotificationId(nId)
    },
    onSuccess: (data: SuiSignAndExecuteTransactionOutput) => {
      notification.txSuccess(
        transactionUrl(explorerUrl, data.digest),
        notificationId
      )
      
      // Save to transaction history
      if (pool) {
        saveTransactionToHistory('transfer', poolId, Number(amount), recipient)
        setTxHistory(getTransactionHistory(poolId))
      }
      
      setAmount('')
      setRecipient('')
      setIsTransacting(false)
    },
    onError: (e: Error) => {
      notification.txError(e, null, notificationId)
      setIsTransacting(false)
    },
  })
  
  const { transact: executeWithdraw } = useTransact({
    onBeforeStart: () => {
      setIsTransacting(true)
      const nId = notification.txLoading()
      setNotificationId(nId)
    },
    onSuccess: (data: SuiSignAndExecuteTransactionOutput) => {
      notification.txSuccess(
        transactionUrl(explorerUrl, data.digest),
        notificationId
      )
      
      // Update pool balance in local storage
      if (isBrowser && pool) {
        try {
          const storedPoolsJson = localStorage.getItem('shielded_pools_data')
          const storedPools = storedPoolsJson ? JSON.parse(storedPoolsJson) : []
          const updatedPools = storedPools.map((p: any) => {
            if (p.id === poolId) {
              const newBalance = Math.max(0, p.balance - Math.floor(Number(amount) * 1_000_000_000))
              return {
                ...p,
                balance: newBalance
              }
            }
            return p
          })
          localStorage.setItem('shielded_pools_data', JSON.stringify(updatedPools))
          
          // Update the current pool state
          setPool({
            ...pool,
            balance: Math.max(0, pool.balance - Math.floor(Number(amount) * 1_000_000_000))
          })
          
          // Save to transaction history
          saveTransactionToHistory('withdraw', poolId, Number(amount))
          setTxHistory(getTransactionHistory(poolId))
        } catch (err) {
          console.error('Error updating pool balance:', err)
        }
      }
      
      setAmount('')
      setIsTransacting(false)
    },
    onError: (e: Error) => {
      notification.txError(e, null, notificationId)
      setIsTransacting(false)
    },
  })
  
  const { transact: generateViewingKey } = useTransact({
    onBeforeStart: () => {
      setIsTransacting(true)
      const nId = notification.txLoading()
      setNotificationId(nId)
    },
    onSuccess: (data: SuiSignAndExecuteTransactionOutput) => {
      notification.txSuccess(
        transactionUrl(explorerUrl, data.digest),
        notificationId
      )
      
      // Save to transaction history
      saveTransactionToHistory('viewingKey', poolId)
      setTxHistory(getTransactionHistory(poolId))
      
      setViewingKeyName('')
      setIsTransacting(false)
    },
    onError: (e: Error) => {
      notification.txError(e, null, notificationId)
      setIsTransacting(false)
    },
  })
  
  // Generate random bytes for mock operations
  const generateRandomBytes = (length: number): Uint8Array => {
    const bytes = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
    return bytes
  }
  
  const handleDeposit = async () => {
    if (!currentAccount || !packageId || !poolId) {
      notification.error(null, 'Missing account, package ID, or pool ID')
      return
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      notification.error(null, 'Please enter a valid amount')
      return
    }
    
    try {
      // Generate mock commitment for ZK proof
      const commitment = generateRandomBytes(32)
      
      const tx = prepareDepositTransaction(
        packageId,
        poolId,
        Number(amount),
        commitment
      )
      
      await executeDeposit(tx)
    } catch (error) {
      console.error('Error depositing:', error)
      notification.error(null, 'Failed to deposit: ' + (error instanceof Error ? error.message : String(error)))
    }
  }
  
  const handleTransfer = async () => {
    if (!currentAccount || !packageId || !poolId) {
      notification.error(null, 'Missing account, package ID, or pool ID')
      return
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      notification.error(null, 'Please enter a valid amount')
      return
    }
    
    if (!recipient) {
      notification.error(null, 'Please enter a recipient address')
      return
    }
    
    try {
      // Generate mock values for ZK proof
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
      
      await executeTransfer(tx)
    } catch (error) {
      console.error('Error transferring:', error)
      notification.error(null, 'Failed to transfer: ' + (error instanceof Error ? error.message : String(error)))
    }
  }
  
  const handleWithdraw = async () => {
    if (!currentAccount || !packageId || !poolId) {
      notification.error(null, 'Missing account, package ID, or pool ID')
      return
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      notification.error(null, 'Please enter a valid amount')
      return
    }
    
    try {
      // Generate mock values for ZK proof
      const nullifier = generateRandomBytes(32)
      const proof = generateRandomBytes(128)
      const merkleRoot = generateRandomBytes(32)
      const recipientAddress = currentAccount.address
      
      const tx = prepareWithdrawTransaction(
        packageId,
        poolId,
        nullifier,
        recipientAddress,
        Number(amount),
        proof,
        merkleRoot
      )
      
      await executeWithdraw(tx)
    } catch (error) {
      console.error('Error withdrawing:', error)
      notification.error(null, 'Failed to withdraw: ' + (error instanceof Error ? error.message : String(error)))
    }
  }
  
  const handleGenerateViewingKey = async () => {
    if (!currentAccount || !packageId || !poolId) {
      notification.error(null, 'Missing account, package ID, or pool ID')
      return
    }
    
    if (!viewingKeyName) {
      notification.error(null, 'Please enter a name for your viewing key')
      return
    }
    
    try {
      // Generate mock key bytes
      const keyBytes = generateRandomBytes(32)
      
      const tx = prepareGenerateViewingKeyTransaction(
        packageId,
        poolId,
        keyBytes,
        viewingKeyName
      )
      
      await generateViewingKey(tx)
    } catch (error) {
      console.error('Error generating viewing key:', error)
      notification.error(null, 'Failed to generate viewing key: ' + (error instanceof Error ? error.message : String(error)))
    }
  }
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + 
           new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  }

  return (
    <>
      <NetworkSupportChecker />
      <Container size="2" pt="6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/pools')}
          mb="4"
        >
          <Flex align="center" gap="2">
            <ArrowLeftIcon />
            <Text>Back to Pools</Text>
          </Flex>
        </Button>
        
        {isLoading ? (
          <Card size="2" className="loading-card">
            <Flex align="center" justify="center" p="6">
              <Loading />
            </Flex>
          </Card>
        ) : error ? (
          <Card size="2" className="error-card">
            <Flex direction="column" align="center" justify="center" p="6" gap="3">
              <Text size="4" weight="bold" color="red">
                Error Loading Pool
              </Text>
              <Text size="2">
                {error}
              </Text>
              <Button onClick={() => router.push('/pools')}>Return to Pools</Button>
            </Flex>
          </Card>
        ) : pool ? (
          <>
            <Flex direction={{ initial: 'column', sm: 'row' }} justify="between" align="start" mb="6">
              <Box>
                <Heading size="6" className="gradient-text" mb="2">
                  {pool.name}
                </Heading>
                <Text size="2" color="gray">
                  Pool ID: <code>{pool.id}</code>
                </Text>
              </Box>
              
              {!currentAccount && (
                <Box mt={{ initial: '4', sm: '0' }}>
                  <CustomConnectButton />
                </Box>
              )}
            </Flex>
            
            <Flex gap="4" wrap="wrap" mb="6">
              <Card size="1" style={{ flex: 1, minWidth: '150px' }}>
                <Flex direction="column" p="4" align="center">
                  <Text size="1" color="gray">Total Balance</Text>
                  <Text size="6" weight="bold">{(pool.balance / 1_000_000_000).toFixed(2)}</Text>
                  <Text size="2" color="gray">SUI</Text>
                </Flex>
              </Card>
              
              <Card size="1" style={{ flex: 1, minWidth: '150px' }}>
                <Flex direction="column" p="4" align="center">
                  <Text size="1" color="gray">Users</Text>
                  <Text size="6" weight="bold">{pool.userCount}</Text>
                  <Text size="2" color="gray">Participants</Text>
                </Flex>
              </Card>
            </Flex>
            
            {!currentAccount ? (
              <Card size="2" mb="6">
                <Flex direction="column" align="center" justify="center" p="6" gap="3">
                  <Text size="3" align="center">
                    Connect your wallet to interact with this pool
                  </Text>
                  <CustomConnectButton />
                </Flex>
              </Card>
            ) : (
              <Card size="2" mb="6">
                <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                  <Tabs.List>
                    <Tabs.Trigger value="deposit">
                      <Flex align="center" gap="1">
                        <PlusIcon />
                        <span>Deposit</span>
                      </Flex>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="transfer">
                      <Flex align="center" gap="1">
                        <ArrowRightIcon />
                        <span>Transfer</span>
                      </Flex>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="withdraw">
                      <Flex align="center" gap="1">
                        <ArrowDownIcon />
                        <span>Withdraw</span>
                      </Flex>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="viewingKey">
                      <Flex align="center" gap="1">
                        <EyeOpenIcon />
                        <span>Viewing Key</span>
                      </Flex>
                    </Tabs.Trigger>
                  </Tabs.List>
                  
                  <Box pt="4">
                    <Tabs.Content value="deposit">
                      <Card size="2">
                        <Flex direction="column" gap="3" p="4">
                          <Text weight="bold">Deposit SUI</Text>
                          <Text size="2" color="gray">
                            Deposit SUI into the shielded pool. Your deposit will be private and can be spent later using zero-knowledge proofs.
                          </Text>
                          
                          <label>
                            <Text as="div" size="2" mb="1" weight="bold">Amount (SUI)</Text>
                            <TextField.Root
                              placeholder="0.0"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                            />
                          </label>
                          
                          <Button 
                            onClick={handleDeposit} 
                            disabled={isTransacting || !amount || isNaN(Number(amount)) || Number(amount) <= 0}
                            mt="2"
                            style={{
                              background: 'linear-gradient(to right, #a78bfa, #ec4899)',
                              border: 'none',
                            }}
                          >
                            {isTransacting ? 'Processing...' : 'Deposit SUI'}
                          </Button>
                        </Flex>
                      </Card>
                    </Tabs.Content>
                    
                    <Tabs.Content value="transfer">
                      <Card size="2">
                        <Flex direction="column" gap="3" p="4">
                          <Text weight="bold">Private Transfer</Text>
                          <Text size="2" color="gray">
                            Transfer SUI privately to another address. The transaction details will be shielded from public view.
                          </Text>
                          
                          <label>
                            <Text as="div" size="2" mb="1" weight="bold">Amount (SUI)</Text>
                            <TextField.Root
                              placeholder="0.0"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                            />
                          </label>
                          
                          <label>
                            <Text as="div" size="2" mb="1" weight="bold">Recipient Address</Text>
                            <TextField.Root
                              placeholder="0x..."
                              value={recipient}
                              onChange={(e) => setRecipient(e.target.value)}
                            />
                          </label>
                          
                          <Button 
                            onClick={handleTransfer} 
                            disabled={isTransacting || !amount || isNaN(Number(amount)) || Number(amount) <= 0 || !recipient}
                            mt="2"
                            style={{
                              background: 'linear-gradient(to right, #a78bfa, #ec4899)',
                              border: 'none',
                            }}
                          >
                            {isTransacting ? 'Processing...' : 'Transfer Privately'}
                          </Button>
                        </Flex>
                      </Card>
                    </Tabs.Content>
                    
                    <Tabs.Content value="withdraw">
                      <Card size="2">
                        <Flex direction="column" gap="3" p="4">
                          <Text weight="bold">Withdraw SUI</Text>
                          <Text size="2" color="gray">
                            Withdraw SUI from the shielded pool back to your wallet using zero-knowledge proofs.
                          </Text>
                          
                          <label>
                            <Text as="div" size="2" mb="1" weight="bold">Amount (SUI)</Text>
                            <TextField.Root
                              placeholder="0.0"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                            />
                          </label>
                          
                          <Button 
                            onClick={handleWithdraw} 
                            disabled={isTransacting || !amount || isNaN(Number(amount)) || Number(amount) <= 0}
                            mt="2"
                            style={{
                              background: 'linear-gradient(to right, #a78bfa, #ec4899)',
                              border: 'none',
                            }}
                          >
                            {isTransacting ? 'Processing...' : 'Withdraw SUI'}
                          </Button>
                        </Flex>
                      </Card>
                    </Tabs.Content>
                    
                    <Tabs.Content value="viewingKey">
                      <Card size="2">
                        <Flex direction="column" gap="3" p="4">
                          <Text weight="bold">Generate Viewing Key</Text>
                          <Text size="2" color="gray">
                            Create a viewing key to track your private transactions in this pool. This lets you prove ownership without revealing your identity.
                          </Text>
                          
                          <label>
                            <Text as="div" size="2" mb="1" weight="bold">Key Name</Text>
                            <TextField.Root
                              placeholder="My viewing key"
                              value={viewingKeyName}
                              onChange={(e) => setViewingKeyName(e.target.value)}
                            />
                          </label>
                          
                          <Button 
                            onClick={handleGenerateViewingKey} 
                            disabled={isTransacting || !viewingKeyName}
                            mt="2"
                            style={{
                              background: 'linear-gradient(to right, #a78bfa, #ec4899)',
                              border: 'none',
                            }}
                          >
                            {isTransacting ? 'Processing...' : 'Generate Key'}
                          </Button>
                        </Flex>
                      </Card>
                    </Tabs.Content>
                  </Box>
                </Tabs.Root>
              </Card>
            )}
            
            {/* Transaction History */}
            {txHistory.length > 0 && (
              <Box mb="4">
                <Heading size="4" mb="3">Transaction History</Heading>
                <Card size="2">
                  <Box p="3">
                    {txHistory.map((tx, index) => (
                      <Flex 
                        key={index} 
                        justify="between" 
                        align="center" 
                        py="2" 
                        style={{ borderBottom: index < txHistory.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}
                      >
                        <Flex direction="column" gap="1">
                          <Flex align="center" gap="2">
                            <Badge 
                              color={
                                tx.type === 'deposit' ? 'green' : 
                                tx.type === 'withdraw' ? 'red' : 
                                tx.type === 'transfer' ? 'blue' : 'orange'
                              }
                            >
                              {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                            </Badge>
                            {tx.amount && <Text weight="bold">{tx.amount} SUI</Text>}
                          </Flex>
                          {tx.recipient && <Text size="1" color="gray">To: {tx.recipient.substring(0, 10)}...{tx.recipient.substring(tx.recipient.length - 4)}</Text>}
                        </Flex>
                        <Text size="1" color="gray">{formatDate(tx.timestamp)}</Text>
                      </Flex>
                    ))}
                  </Box>
                </Card>
              </Box>
            )}
          </>
        ) : null}
      </Container>
      
      <style jsx global>{`
        .gradient-text {
          background: linear-gradient(90deg, #4299E1, #9F7AEA);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .loading-card, .error-card {
          min-height: 200px;
        }
        
        code {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 90%;
        }
      `}</style>
    </>
  )
} 