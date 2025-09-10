export async function testConnection(provider: 'sqlite'|'postgres', url: string) {
  try {
    if (provider === 'sqlite') {
      return url.startsWith('file:')
    } else {
      const u = new URL(url)
      return !!u.hostname && !!u.pathname.replace('/', '')
    }
  } catch {
    return false
  }
}