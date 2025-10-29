// src/main.jsx (or src/index.js)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux'; // <-- 1. Import Provider
import App from './App.jsx';
import { store } from './redux/store'; // <-- 2. Import your configured store
import './index.css'; // Global CSS/Tailwind import

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. Wrap the root component (<App />) with the Provider */}
    <Provider store={store}> 
      <App />
    </Provider>
  </React.StrictMode>,
);