export const environment = {
  production: true,
  auth0: {
    domain: 'dev-7y1grk6neur7cepa.us.auth0.com',
    clientId: '1SUlgxNbRtrYEnhfeNexrC9rs13QgwoU',
    authorizationParams: {
      redirect_uri: `${window.location.origin}/callback`,
      audience: 'https://gayness-scale-backend/'
    }
  },
  api: {
    serverUrl: 'https://gayness-scale-api.francis1592.workers.dev'
  }
}; 