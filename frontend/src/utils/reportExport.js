const extensions = {
  csv: 'csv',
  excel: 'xls',
  pdf: 'pdf',
}

export const downloadAdminReport = async (type, token, format = 'csv') => {
  const response = await fetch(`http://localhost:4000/api/admin/reports/export/${type}?format=${format}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) throw new Error('Unable to download report.')

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${type}-report.${extensions[format] || 'csv'}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
