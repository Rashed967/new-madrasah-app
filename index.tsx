
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const queryClient = new QueryClient();

try {
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </React.StrictMode>
  );
} catch (error) {
  console.error("Critical rendering error:", error);
  // Fallback UI or error message
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: SolaimanLipi, Arial, sans-serif;">
      <h1 style="color: #D32F2F; margin-bottom: 15px;"> অ্যাপ্লিকেশন শুরু করতে সমস্যা হয়েছে। </h1>
      <p style="color: #555; margin-bottom: 10px;"> বিস্তারিত জানার জন্য অনুগ্রহ করে ব্রাউজার কনসোল দেখুন। </p>
      <pre style="text-align: left; background: #f0f0f0; padding: 10px; border-radius: 5px; overflow: auto; color: #333; font-size: 0.9em; max-height: 300px;">${(error as Error).stack || (error as Error).message}</pre>
    </div>
  `;
}
