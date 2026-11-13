import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'
import './pixel.css'
import './shadcn.css'

const rootElement = document.getElementById('root')
if (rootElement) {
  const mode = rootElement.dataset.mode === 'sidebar' ? 'sidebar' : 'panel'
  createRoot(rootElement).render(<App mode={mode} />)
}
