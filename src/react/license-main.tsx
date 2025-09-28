import React from 'react';
import ReactDOM from 'react-dom/client';
import LicenseApp from './components/license/LicenseApp';
import './styles/globals.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('license-root')!).render(
  <React.StrictMode>
    <LicenseApp />
  </React.StrictMode>,
);