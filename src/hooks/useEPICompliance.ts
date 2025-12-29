import { useMemo } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { useEPIs } from '@/hooks/useEPIs';
import { useEPIDeliveries } from '@/hooks/useEPIDeliveries';
import { useEPIRequirements } from '@/hooks/useEPIRequirements';

export interface EmployeeComplianceStatus {
  employeeId: string;
  employeeName: string;
  department: string | null;
  position: string | null;
  requiredCategories: string[];
  deliveredCategories: string[];
  missingCategories: string[];
  expiredCategories: string[];
  isCompliant: boolean;
  complianceRate: number;
}

export const useEPICompliance = () => {
  const { employees } = useEmployees();
  const { epis } = useEPIs();
  const { deliveries } = useEPIDeliveries();
  const { requirements, getRequirementsFor } = useEPIRequirements();

  const complianceStatus = useMemo(() => {
    const activeEmployees = employees.filter(e => e.status === 'active');
    const today = new Date();

    return activeEmployees.map(employee => {
      // Get required EPI categories for this employee
      const employeeRequirements = getRequirementsFor(
        employee.department || undefined,
        employee.position || undefined
      );
      const requiredCategories = [...new Set(employeeRequirements.map(r => r.epi_category))];

      // Get employee's current valid deliveries
      const employeeDeliveries = deliveries.filter(d => 
        d.employee_id === employee.id && 
        d.status === 'in_use'
      );

      // Map deliveries to EPI categories
      const deliveredCategoriesWithExpiry: { category: string; expiryDate: string | null }[] = [];
      
      employeeDeliveries.forEach(delivery => {
        const epi = epis.find(e => e.id === delivery.epi_id);
        if (epi?.category) {
          deliveredCategoriesWithExpiry.push({
            category: epi.category,
            expiryDate: delivery.expiry_date,
          });
        }
      });

      // Check for expired categories
      const expiredCategories = deliveredCategoriesWithExpiry
        .filter(d => d.expiryDate && new Date(d.expiryDate) < today)
        .map(d => d.category);

      // Valid delivered categories (not expired)
      const validDeliveredCategories = deliveredCategoriesWithExpiry
        .filter(d => !d.expiryDate || new Date(d.expiryDate) >= today)
        .map(d => d.category);

      const uniqueValidCategories = [...new Set(validDeliveredCategories)];

      // Missing categories
      const missingCategories = requiredCategories.filter(
        req => !uniqueValidCategories.includes(req)
      );

      const isCompliant = missingCategories.length === 0 && expiredCategories.length === 0;
      const complianceRate = requiredCategories.length > 0
        ? ((requiredCategories.length - missingCategories.length) / requiredCategories.length) * 100
        : 100;

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.department,
        position: employee.position,
        requiredCategories,
        deliveredCategories: uniqueValidCategories,
        missingCategories,
        expiredCategories: [...new Set(expiredCategories)],
        isCompliant,
        complianceRate,
      };
    });
  }, [employees, epis, deliveries, requirements, getRequirementsFor]);

  // Summary statistics
  const summary = useMemo(() => {
    const total = complianceStatus.length;
    const compliant = complianceStatus.filter(s => s.isCompliant).length;
    const withMissing = complianceStatus.filter(s => s.missingCategories.length > 0).length;
    const withExpired = complianceStatus.filter(s => s.expiredCategories.length > 0).length;
    
    return {
      totalEmployees: total,
      compliantEmployees: compliant,
      nonCompliantEmployees: total - compliant,
      employeesWithMissingEPI: withMissing,
      employeesWithExpiredEPI: withExpired,
      overallComplianceRate: total > 0 ? (compliant / total) * 100 : 100,
    };
  }, [complianceStatus]);

  // Get non-compliant employees (for alerts)
  const nonCompliantEmployees = useMemo(() => {
    return complianceStatus.filter(s => !s.isCompliant);
  }, [complianceStatus]);

  return {
    complianceStatus,
    summary,
    nonCompliantEmployees,
    hasRequirements: requirements.length > 0,
  };
};
