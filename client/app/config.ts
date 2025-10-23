import { 
    createConfig, 
    http, 
    cookieStorage,
    createStorage
  } from 'wagmi'
  import { celoSepolia } from 'wagmi/chains'
  
  export function getConfig() {
    return createConfig({
      chains: [celoSepolia],
      ssr: true,
      storage: createStorage({
        storage: cookieStorage,
      }),
      transports: {
        [celoSepolia.id]: http(),
      },
    })
  }