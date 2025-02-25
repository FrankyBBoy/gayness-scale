export const environment = {
  production: false,
  auth0: {
    domain: 'dev-7y1grk6neur7cepa.us.auth0.com',
    clientId: '1SUlgxNbRtrYEnhfeNexrC9rs13QgwoU',
    authorizationParams: {
      redirect_uri: window.location.origin,
    }
  },
  api: {
    serverUrl: 'http://localhost:8787', // URL de votre Cloudflare Worker en développement
  }
}; 