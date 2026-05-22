import React from 'react';
import AppRoutes from './routes/AppRoutes';

const App: React.FC = () => {
  return (
    <div className="w-full min-h-screen selection:bg-yellow-200">
      <AppRoutes />
    </div>
  );
};

export default App;
