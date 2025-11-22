import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import PackageComparison from './components/calculator/PackageComparison';
import Footer from './components/ui/footer';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 py-8 mx-auto flex flex-col">
        <div className="container max-w-7xl mx-auto px-4 flex-grow">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Tech Compensation Calculator</h1>
            <p className="text-gray-600 mt-2">
              Project and compare total compensation packages including salary growth, bonuses, and equity grants.
            </p>
          </header>
          <main>
            <PackageComparison />
          </main>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;