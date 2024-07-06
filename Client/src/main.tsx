import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import './i18n.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <React.Suspense fallback="Loading...">
      <App />
    </React.Suspense>
  </React.StrictMode>,
)
