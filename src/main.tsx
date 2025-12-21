import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

// Desactivamos StrictMode para evitar warnings de react-quill con findDOMNode
// react-quill todavía usa findDOMNode que está deprecado en React.StrictMode
const isDev = import.meta.env.DEV;
const Wrapper = isDev ? React.Fragment : StrictMode;

createRoot(document.getElementById('root')!).render(
  <Wrapper>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </Wrapper>
);
