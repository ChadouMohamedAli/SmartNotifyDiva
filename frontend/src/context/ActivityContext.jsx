import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ActivityContext = createContext();

export const ActivityProvider = ({ children }) => {
  const [activityRefreshTrigger, setActivityRefreshTrigger] = useState(0);

  // Fonction pour déclencher un rafraîchissement
  const triggerActivityRefresh = useCallback(() => {
    setActivityRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <ActivityContext.Provider value={{ activityRefreshTrigger, triggerActivityRefresh }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivityContext = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivityContext doit être utilisé dans ActivityProvider');
  }
  return context;
};
