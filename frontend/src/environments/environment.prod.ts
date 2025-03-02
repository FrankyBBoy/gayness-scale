export const environment = {
  production: true,
  auth0: {
    domain: 'dev-7y1grk6neur7cepa.us.auth0.com',
    clientId: 'UrIUfilBnLEKVqWLc6s3lN8cLHcXW5vx',
    authorizationParams: {
      redirect_uri: `${window.location.origin}/callback`,
      audience: 'https://gayness-scale-backend-prod/'
    }
  },
  api: {
    serverUrl: 'https://gayness-scale-api-production.francis1592.workers.dev'
  }
}; 