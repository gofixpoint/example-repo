import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AmikaPage from './AmikaPage'
import { usePath } from './router'
import './styles.css'

function Site() {
  const path = usePath()
  return path === '/amika' ? <AmikaPage /> : <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Site />
  </React.StrictMode>
)
