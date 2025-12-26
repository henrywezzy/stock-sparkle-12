import { useState, useEffect, useCallback } from 'react';

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface ColumnPreferences {
  columns: ColumnConfig[];
}

const getStorageKey = (pageId: string) => `column_preferences_${pageId}`;

export const useColumnPreferences = (
  pageId: string,
  defaultColumns: Omit<ColumnConfig, 'order'>[]
) => {
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    // Initialize with defaults
    return defaultColumns.map((col, index) => ({
      ...col,
      order: index,
    }));
  });

  // Load preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(pageId));
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ColumnConfig[];
        // Merge with defaults to handle new columns
        const merged = defaultColumns.map((defaultCol, index) => {
          const saved = parsed.find((p) => p.key === defaultCol.key);
          if (saved) {
            return {
              ...defaultCol,
              visible: saved.visible,
              order: saved.order,
            };
          }
          return { ...defaultCol, order: index + parsed.length };
        });
        // Sort by order
        merged.sort((a, b) => a.order - b.order);
        setColumns(merged);
      } catch {
        // Ignore parse errors
      }
    }
  }, [pageId]);

  // Save preferences to localStorage
  const savePreferences = useCallback(
    (newColumns: ColumnConfig[]) => {
      localStorage.setItem(getStorageKey(pageId), JSON.stringify(newColumns));
      setColumns(newColumns);
    },
    [pageId]
  );

  const toggleColumn = useCallback(
    (key: string) => {
      const updated = columns.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      );
      savePreferences(updated);
    },
    [columns, savePreferences]
  );

  const reorderColumns = useCallback(
    (fromIndex: number, toIndex: number) => {
      const updated = [...columns];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      // Update order values
      const reordered = updated.map((col, index) => ({ ...col, order: index }));
      savePreferences(reordered);
    },
    [columns, savePreferences]
  );

  const resetToDefaults = useCallback(() => {
    const defaults = defaultColumns.map((col, index) => ({
      ...col,
      order: index,
    }));
    savePreferences(defaults);
  }, [defaultColumns, savePreferences]);

  const visibleColumns = columns.filter((col) => col.visible);

  return {
    columns,
    visibleColumns,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  };
};
