// Vercel must receive the API address before Expo embeds it in the web bundle.
try {
  const value = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!value) throw new Error('missing URL');
  const url = new URL(value);
  const localHost = /^(localhost|127\.|\[::1\])/.test(url.hostname)
    || url.hostname.endsWith('.localhost');
  if (url.protocol !== 'https:' || localHost || url.username || url.password
      || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('invalid API origin');
  }
  console.log('Endereço HTTPS da API configurado para a publicação.');
} catch {
  console.error('Configure EXPO_PUBLIC_API_URL na Vercel com a origem HTTPS da API publicada, sem /api, credenciais ou parâmetros.');
  process.exit(1);
}
