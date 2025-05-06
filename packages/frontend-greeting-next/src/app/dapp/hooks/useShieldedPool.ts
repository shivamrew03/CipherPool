import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit'
import { useQuery } from '@tanstack/react-query'
import { CONTRACT_PACKAGE_VARIABLE_NAME } from '~~/config/network'
import useNetworkConfig from '~~/hooks/useNetworkConfig'

export function useShieldedPool() {
  const suiClient = useSuiClient()
  const currentAccount = useCurrentAccount()
  const { useNetworkVariable } = useNetworkConfig()
  const packageId = useNetworkVariable(CONTRACT_PACKAGE_VARIABLE_NAME)

  return useQuery({
    queryKey: ['shielded-pool', currentAccount?.address, packageId],
    queryFn: async () => {
      if (!currentAccount) {
        console.log('No connected wallet')
        return { data: [] }
      }

      try {
        console.log('Fetching objects for address:', currentAccount.address)
        
        const { data } = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          options: {
            showContent: true,
            showDisplay: true,
          },
        })
        
        console.log('Fetched objects:', data)
        
        return { data }
      } catch (e) {
        console.error('Error fetching shielded pool:', e)
        // Return empty array instead of throwing
        return { data: [] }
      }
    },
    enabled: !!currentAccount,
    // Add retry parameters to handle transient network issues
    retry: 3,
    retryDelay: 1000,
    // Don't refetch on window focus to avoid repeated errors
    refetchOnWindowFocus: false,
  })
} 