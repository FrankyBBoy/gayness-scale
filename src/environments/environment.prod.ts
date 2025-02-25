export const environment = {
  production: true,
  auth0: {
    domain: 'dev-7y1grk6neur7cepa.us.auth0.com',
    clientId: '1SUlgxNbRtrYEnhfeNexrC9rs13QgwoU',
    authorizationParams: {
      redirect_uri: window.location.origin,
    }
  },
  api: {
    serverUrl: 'https://api.gayness-scale.app', // URL de production de votre Cloudflare Worker
  }
}; 