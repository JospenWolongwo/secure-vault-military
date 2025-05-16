import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  standalone: true,
})
export class FileSizePipe implements PipeTransform {
  private units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  /**
   * Transforms a number (bytes) into a human-readable file size string
   * @param bytes The size in bytes
   * @param precision Number of decimal places (default: 2)
   * @returns Formatted file size string (e.g., '1.23 MB')
   */
  transform(bytes: number = 0, precision: number = 2): string {
    if (isNaN(parseFloat(String(bytes))) || !isFinite(bytes)) {
      return '?';
    }

    let unit = 0;

    // Convert to a positive number if it's negative
    const absBytes = Math.abs(bytes);

    // Determine the appropriate unit
    while (absBytes >= 1024 && unit < this.units.length - 1) {
      bytes /= 1024;
      unit++;
    }

    // Format the number with the specified precision
    const value = bytes.toFixed(precision);

    // Return the formatted string with the unit
    return `${value} ${this.units[unit]}`;
  }
}
