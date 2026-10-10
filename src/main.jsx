import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import App from './App.jsx'

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }    
  }
  componentDidCatch(error) {
    console.error('Student Portal failed to render:', error)
  }
  render() {
    if (this.state.failed) {
      return <main style={{maxWidth: 640, margin: '12vh auto', padding: 24, fontFamily: 'sans-serif', color: '#24352f'}}>
        <h1>Student Portal couldn’t load</h1>
        <p>Refresh the page to try again. If the problem continues, please contact support.</p>
      </main>
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(<AppErrorBoundary><App /></AppErrorBoundary>)
          
