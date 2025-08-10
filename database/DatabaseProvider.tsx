import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { databaseManager } from './database';
import {
    imagesRepository,
    ImagesRepository,
    recogEventsRepository,
    RecogEventsRepository,
    recordsRepository,
    RecordsRepository,
    templatesRepository,
    TemplatesRepository
} from './repositories';

interface DatabaseContextType {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  repositories: {
    templates: TemplatesRepository;
    images: ImagesRepository;
    records: RecordsRepository;
    recogEvents: RecogEventsRepository;
  };
  reinitialize: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeDatabase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await databaseManager.initialize();
      
      setIsReady(true);
      console.log('Database provider initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
      setError(errorMessage);
      console.error('Database provider initialization failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const reinitialize = async () => {
    setIsReady(false);
    await initializeDatabase();
  };

  useEffect(() => {
    initializeDatabase();

    // Cleanup function to close database connection when component unmounts
    return () => {
      databaseManager.close().catch(console.error);
    };
  }, []);

  const contextValue: DatabaseContextType = {
    isReady,
    isLoading,
    error,
    repositories: {
      templates: templatesRepository,
      images: imagesRepository,
      records: recordsRepository,
      recogEvents: recogEventsRepository,
    },
    reinitialize,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextType {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

// Hook for easy access to repositories
export function useRepositories() {
  const { repositories, isReady } = useDatabase();
  
  if (!isReady) {
    throw new Error('Database is not ready. Make sure to check isReady before using repositories.');
  }
  
  return repositories;
}

// Individual repository hooks for convenience
export function useTemplatesRepository() {
  const { repositories, isReady } = useDatabase();
  
  if (!isReady) {
    throw new Error('Database is not ready. Make sure to check isReady before using templates repository.');
  }
  
  return repositories.templates;
}

export function useImagesRepository() {
  const { repositories, isReady } = useDatabase();
  
  if (!isReady) {
    throw new Error('Database is not ready. Make sure to check isReady before using images repository.');
  }
  
  return repositories.images;
}

export function useRecordsRepository() {
  const { repositories, isReady } = useDatabase();
  
  if (!isReady) {
    throw new Error('Database is not ready. Make sure to check isReady before using records repository.');
  }
  
  return repositories.records;
}

export function useRecogEventsRepository() {
  const { repositories, isReady } = useDatabase();
  
  if (!isReady) {
    throw new Error('Database is not ready. Make sure to check isReady before using recognition events repository.');
  }
  
  return repositories.recogEvents;
}

// Utility hook for database operations with error handling
export function useDatabaseOperation<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (operation: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      console.error('Database operation failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    execute,
    loading,
    error,
    clearError,
  };
}