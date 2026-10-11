import { useContext } from 'react'

import { CyberResolveContext } from '../contexts/CyberResolveContext'

export function useCyberResolve() {
  const context = useContext(CyberResolveContext)

  if (!context) {
    throw new Error('useCyberResolve must be used within a CyberResolveContextProvider.')
  }

  return context
}