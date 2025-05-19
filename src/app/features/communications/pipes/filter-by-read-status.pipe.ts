import { Pipe, PipeTransform } from '@angular/core';
import { CommunicationWithReadStatus } from '../models/communication.model';

@Pipe({
  name: 'filterByReadStatus',
  standalone: true
})
export class FilterByReadStatusPipe implements PipeTransform {
  transform(items: CommunicationWithReadStatus[], readStatus: 'all' | 'read' | 'unread'): CommunicationWithReadStatus[] {
    if (!items) return [];
    if (readStatus === 'all') return items;
    
    return items.filter(item => {
      if (readStatus === 'read') {
        return !!item.read_at;
      } else {
        return !item.read_at;
      }
    });
  }
}
