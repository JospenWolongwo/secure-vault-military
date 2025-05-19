import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform<T>(items: T[], searchText: string, properties?: string): T[] {
    if (!items) return [];
    if (!searchText) return items;
    
    searchText = searchText.toLowerCase();
    const propertyArray = properties ? properties.split(',') : [];
    
    return items.filter(item => {
      if (propertyArray.length > 0) {
        // Search in specified properties
        return propertyArray.some(property => {
          const propPath = property.trim().split('.');
          let value = item as any;
          
          // Handle nested properties
          for (const prop of propPath) {
            if (value === null || value === undefined) return false;
            value = value[prop];
          }
          
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(searchText);
        });
      } else {
        // Search in all properties
        return Object.keys(item as object).some(key => {
          const value = (item as any)[key];
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(searchText);
        });
      }
    });
  }
}
