export const environment = {
  production: false,
  auth0: {
    domain: 'dev-7y1grk6neur7cepa.us.auth0.com',
    clientId: 'tVKlDFBcmF9XHDtcNlOZJAKNfNyYPqBa',
    authorizationParams: {
      redirect_uri: 'http://localhost:4200/callback',
      audience: 'https://gayness-scale-backend/'
    }
  },
  api: {
    serverUrl: 'http://127.0.0.1:8787'
  }
}; 