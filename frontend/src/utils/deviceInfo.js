export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent || ''
  const browser = userAgent.includes('Edg')
    ? 'Microsoft Edge'
    : userAgent.includes('Chrome')
      ? 'Chrome'
      : userAgent.includes('Firefox')
        ? 'Firefox'
        : userAgent.includes('Safari')
          ? 'Safari'
          : 'Unknown Browser'

  const operatingSystem = userAgent.includes('Windows')
    ? 'Windows'
    : userAgent.includes('Mac')
      ? 'macOS'
      : userAgent.includes('Android')
        ? 'Android'
        : userAgent.includes('iPhone') || userAgent.includes('iPad')
          ? 'iOS'
          : userAgent.includes('Linux')
            ? 'Linux'
            : 'Unknown OS'

  const deviceType = /Mobi|Android|iPhone|iPad/i.test(userAgent)
    ? /iPad|Tablet/i.test(userAgent) ? 'Tablet' : 'Mobile'
    : 'Desktop'

  return {
    browser,
    operatingSystem,
    deviceType,
    userAgent,
    ipAddress: ''
  }
}
