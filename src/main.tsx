import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import MarketplaceApp from './MarketplaceApp.tsx'
import StaffApp from './StaffApp.tsx'
import { resolveSiteMode } from './lib/siteMode.ts'
import CookieConsentProvider from './components/privacy/CookieConsentProvider.tsx'

const siteMode = resolveSiteMode()
const RootApp = siteMode === 'marketplace' ? MarketplaceApp : siteMode === 'staff' ? StaffApp : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CookieConsentProvider siteMode={siteMode}>
      <RootApp />
    </CookieConsentProvider>
  </StrictMode>,
)
