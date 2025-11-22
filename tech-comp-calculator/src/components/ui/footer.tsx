import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-center text-sm">
          © {new Date().getFullYear()} Frank Harris. All rights reserved.
        </p>
      </div>
    </footer>
  );
}