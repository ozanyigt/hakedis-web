export interface DynamicFilter {
  field: string;
  operator: string;
  value: string | number | boolean;
}

export function createEqFilter(field: string, value: string): { filter: DynamicFilter } {
  return {
    filter: {
      field,
      operator: 'eq',
      value,
    },
  };
}
