import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-4 sm:mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 overflow-x-auto">
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-1 flex-shrink-0">
              {index > 0 && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />}
              {item.href ? (
                <Link to={item.href} className="hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{title}</h1>
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 overflow-x-auto pb-1 sm:pb-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
