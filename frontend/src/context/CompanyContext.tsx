import React, { createContext, useContext, useState, useEffect } from 'react';

interface Company {
  id: number;
  name: string;
}

interface CompanyContextType {
  companies: Company[];
  selectedCompanyId: number | null;
  setSelectedCompanyId: (id: number) => void;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/companies`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCompanies(data);
          if (data.length > 0) {
            setSelectedCompanyId(data[0].id);
          }
        } else {
          console.error("Backend error or invalid data format:", data);
          setCompanies([]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch companies:", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <CompanyContext.Provider value={{ companies, selectedCompanyId, setSelectedCompanyId, isLoading }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) throw new Error('useCompany must be used within a CompanyProvider');
  return context;
};
