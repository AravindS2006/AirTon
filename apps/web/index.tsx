import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@fontsource-variable/anybody/wdth.css';
import '@fontsource-variable/instrument-sans/wdth.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import './index.css';
import App from './App';
import { IrisProvider } from './components/immersive/Iris';
import { ThemeProvider } from './components/immersive/Theme';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <IrisProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </IrisProvider>
    </HashRouter>
  </React.StrictMode>,
);
