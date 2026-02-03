import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CasinoProvider } from './context/CasinoContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CasinoProvider>
      <App />
    </CasinoProvider>
  </React.StrictMode>
);
