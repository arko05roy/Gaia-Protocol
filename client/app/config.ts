import { 
    createConfig, 
    http, 
    cookieStorage,
    createStorage
  } from 'wagmi'
  import { celoSepolia } from 'wagmi/chains'
  import { defineChain } from 'viem'
  
  // GaiaL3 Chain Configuration
  export const gaiaL3 = defineChain({
    id: 424242,
    name: 'GaiaL3',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: ['http://localhost:8546'],
      },
    },
    blockExplorers: {
      default: {
        name: 'GaiaL3 Explorer',
        url: 'http://localhost:8546',
      },
    },
  })
  
  export function getConfig() {
    return createConfig({
      chains: [gaiaL3],
      ssr: true,
      storage: createStorage({
        storage: cookieStorage,
      }),
      transports: {
        [gaiaL3.id]: http('http://localhost:8546'),
      },
    })
  }