'use client'

import { Dialog, Box, Button, Card, Container, Flex, Heading, Text, Table, TextField } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import CustomConnectButton from '~~/components/CustomConnectButton'
import NetworkSupportChecker from '~~/components/NetworkSupportChecker'
import { useAvailablePools, ShieldedPool } from '~~/dapp/hooks/useAvailablePools'
import { useCurrentAccount } from '@mysten/dapp-kit'
import Loading from '~~/components/Loading'
import { SuiSignAndExecuteTransactionOutput } from '@mysten/wallet-standard'
import useTransact from '@suiware/kit/useTransact'
import { CONTRACT_PACKAGE_VARIABLE_NAME, EXPLORER_URL_VARIABLE_NAME } from '~~/config/network'
import useNetworkConfig from '~~/hooks/useNetworkConfig'
import { prepareCreateShieldedPoolTransaction } from '~~/dapp/helpers/transactions'
import { notification } from '~~/helpers/notification'
import { transactionUrl } from '~~/helpers/network'

// Browser-safe helper
const isBrowser = typeof window !== 'undefined'

// Helper to get pools from local storage
const getPoolsFromLocalStorage = (): any[] => {
  if (!isBrowser) return []
  
  try {
    const poolsData = localStorage.getItem('shielded_pools_data')
    return poolsData ? JSON.parse(poolsData) : []
  } catch (error) {
    console.error('Failed to get pools from localStorage:', error)
    return []
  }
}

// Helper to save pools to local storage
const savePoolToLocalStorage = (pool: any) => {
  if (!isBrowser) return
  
  try {
    // Get existing pools
    const storedPoolsJson = localStorage.getItem('shielded_pools_data')
    const storedPools = storedPoolsJson ? JSON.parse(storedPoolsJson) : []
    
    // Add new pool
    storedPools.push(pool)
    
    // Save back to storage
    localStorage.setItem('shielded_pools_data', JSON.stringify(storedPools))
  } catch (err) {
    console.error("Error saving pool to localStorage:", err)
  }
}

export default function PoolsPage() {
  const router = useRouter()
  const currentAccount = useCurrentAccount()
  const { data, isPending, error, refetch } = useAvailablePools()
  const [isCreatePoolDialogOpen, setIsCreatePoolDialogOpen] = useState(false)
  const [poolName, setPoolName] = useState('')
  const [notificationId, setNotificationId] = useState<string>()
  
  const { useNetworkVariable } = useNetworkConfig()
  const packageId = useNetworkVariable(CONTRACT_PACKAGE_VARIABLE_NAME)
  const explorerUrl = useNetworkVariable(EXPLORER_URL_VARIABLE_NAME)
  
  // Track if we've shown the wallet connection request
  const [hasShownWalletRequest, setHasShownWalletRequest] = useState(false)
  
  useEffect(() => {
    // Set flag when account is connected
    if (currentAccount) {
      setHasShownWalletRequest(true)
    }
  }, [currentAccount])
  
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
      setIsCreatePoolDialogOpen(false)
      setPoolName('')
      refetch()
    },
    onError: (e: Error) => {
      notification.txError(e, null, notificationId)
    },
  })
  
  const handleCreatePool = async () => {
    if (!packageId) {
      notification.error(null, 'Package ID is not defined or invalid')
      return
    }
    
    try {
      console.log('Creating shielded pool with package ID:', packageId)
      const tx = prepareCreateShieldedPoolTransaction(packageId)
      
      // Save pool name to local storage before transaction
      if (isBrowser) {
        const tempId = '0x' + Math.random().toString(16).substr(2, 40)
        const tempPool = {
          id: tempId,
          balance: 0,
          userCount: 0,
          name: poolName || `Shielded Pool ${tempId.substring(0, 8)}`,
          createdAt: Date.now()
        }
        
        savePoolToLocalStorage(tempPool)
      }
      
      await createPool(tx)
    } catch (error) {
      console.error("Error creating pool:", error)
      notification.error(null, 'Failed to create pool: ' + (error instanceof Error ? error.message : String(error)))
    }
  }
  
  const handlePoolClick = (pool: ShieldedPool) => {
    router.push(`/pools/${pool.id}`)
  }
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const shouldShowConnectWallet = !currentAccount && !hasShownWalletRequest
  
  return (
    <>
      <NetworkSupportChecker />
      <Container size="3" pt="6">
        <Flex justify="between" align="center" mb="6">
          <Heading size="6" className="gradient-text">
            Available Shielded Pools
          </Heading>
          
          {currentAccount ? (
            <Button
              onClick={() => setIsCreatePoolDialogOpen(true)}
              style={{
                background: 'linear-gradient(to right, #a78bfa, #ec4899)',
                border: 'none',
              }}
            >
              Create New Pool
            </Button>
          ) : shouldShowConnectWallet ? (
            <CustomConnectButton />
          ) : null}
        </Flex>
        
        {isPending ? (
          <Card size="2" className="loading-card">
            <Flex align="center" justify="center" p="6">
              <Loading />
            </Flex>
          </Card>
        ) : error ? (
          <Card size="2" className="error-card">
            <Flex direction="column" align="center" justify="center" p="6" gap="3">
              <Text size="4" weight="bold" color="red">
                Error Loading Pools
              </Text>
              <Text size="2">
                There was an issue fetching available pools. Please try again later.
              </Text>
              <Button onClick={() => refetch()}>Try Again</Button>
            </Flex>
          </Card>
        ) : data?.pools && data.pools.length > 0 ? (
          <Card size="2" style={{ overflow: 'hidden' }}>
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Balance (SUI)</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Users</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              
              <Table.Body>
                {data.pools.map((pool: ShieldedPool) => (
                  <Table.Row key={pool.id} className="pool-row">
                    <Table.Cell>{pool.name}</Table.Cell>
                    <Table.Cell>{(pool.balance / 1_000_000_000).toFixed(2)}</Table.Cell>
                    <Table.Cell>{pool.userCount}</Table.Cell>
                    <Table.Cell>{formatDate(pool.createdAt)}</Table.Cell>
                    <Table.Cell>
                      <Button size="1" onClick={() => handlePoolClick(pool)}>
                        View Details
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Card>
        ) : (
          <Card size="2" className="empty-card">
            <Flex direction="column" align="center" justify="center" p="6" gap="3">
              <Text size="4" weight="bold">
                No Pools Available
              </Text>
              {currentAccount ? (
                <>
                  <Text size="2" align="center">
                    There are no shielded pools available yet. Be the first to create one!
                  </Text>
                  <Button 
                    onClick={() => setIsCreatePoolDialogOpen(true)}
                    style={{
                      background: 'linear-gradient(to right, #a78bfa, #ec4899)',
                      border: 'none',
                    }}
                  >
                    Create New Pool
                  </Button>
                </>
              ) : (
                <>
                  <Text size="2" align="center">
                    Connect your wallet to view or create shielded pools.
                  </Text>
                  <CustomConnectButton />
                </>
              )}
            </Flex>
          </Card>
        )}
        
        <Dialog.Root open={isCreatePoolDialogOpen} onOpenChange={setIsCreatePoolDialogOpen}>
          <Dialog.Content style={{ maxWidth: 450 }}>
            <Dialog.Title>Create New Shielded Pool</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Create a new privacy-preserving pool for SUI asset transfers.
            </Dialog.Description>
            
            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Pool Name
                </Text>
                <TextField.Root 
                  placeholder="My Shielded Pool" 
                  value={poolName}
                  onChange={(e) => setPoolName(e.target.value)}
                />
                <Text as="div" size="1" color="gray" mt="1">
                  Note: Names are for display purposes only
                </Text>
              </label>
            </Flex>
            
            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button 
                onClick={handleCreatePool} 
                style={{
                  background: 'linear-gradient(to right, #a78bfa, #ec4899)',
                  border: 'none',
                }}
              >
                Create Pool
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </Container>
      
      <style jsx global>{`
        .gradient-text {
          background: linear-gradient(90deg, #4299E1, #9F7AEA);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .pool-row {
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .pool-row:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        .loading-card, .error-card, .empty-card {
          min-height: 200px;
        }
      `}</style>
    </>
  )
} 