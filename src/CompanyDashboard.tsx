// CompanyDashboard.tsx
import React from "react";
import JobbVareUttak from "./JobbVareUttak";

interface CompanyDashboardProps {
  firmaId: string;
}

const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ firmaId }) => {
  return (
    <div>
      <h2>Firma Dashboard</h2>
      <p>Velkommen til Firma: {firmaId}</p>
      <JobbVareUttak verkstedId={firmaId} />
    </div>
  );
};

export default CompanyDashboard;
