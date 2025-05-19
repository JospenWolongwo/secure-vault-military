import { Pipe, PipeTransform } from '@angular/core';
import { CommunicationWithReadStatus } from '../models/communication.model';

@Pipe({
  name: 'filterByPriority',
  standalone: true
})
export class FilterByPriorityPipe implements PipeTransform {
  transform(items: CommunicationWithReadStatus[], priority: string | null): CommunicationWithReadStatus[] {
    if (!items) return [];
    if (!priority) return items;
    
    return items.filter(item => item.priority === priority);
  }
}
