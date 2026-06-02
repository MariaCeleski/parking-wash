/**
 * Utility to export data as CSV file download
 * Reusable for any table data in the application
 */

export interface CsvColumn {
  header: string
  key: string
  format?: (value: any) => string
}

export function exportToCsv(
  filename: string,
  columns: CsvColumn[],
  data: Record<string, any>[]
): void {
  // Build header row
  const headerRow = columns.map(col => `"${col.header}"`).join(';')

  // Build data rows
  const dataRows = data.map(row =>
    columns.map(col => {
      const value = row[col.key]
      const formatted = col.format ? col.format(value) : String(value ?? '')
      // Escape quotes in CSV
      return `"${formatted.replace(/"/g, '""')}"`
    }).join(';')
  )

  // Combine
  const csvContent = [headerRow, ...dataRows].join('\n')

  // Add BOM for Excel compatibility with accents
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })

  // Trigger download
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
