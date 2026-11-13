import { createContext, useContext } from 'react'

/**
 * The theme and skin classes live on the `.app` element, so portalled
 * overlays must render there (not on `document.body`) to keep the tokens and
 * the active colour mode.
 */
const PortalContainerContext = createContext<HTMLElement | null>(null)

export const PortalContainerProvider = PortalContainerContext.Provider

export function usePortalContainer(): HTMLElement | null {
  return useContext(PortalContainerContext)
}
