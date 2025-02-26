export const environment = {
  production: false,
  api: {
    serverUrl: 'http://127.0.0.1:8787'
  },
  auth0: {
    domain: 'dev-jf6w4dg6.us.auth0.com',
    clientId: 'tVKlDFBcmF9XHDtcNlOZJAKNfNyYPqBa',
    authorizationParams: {
      redirect_uri: 'http://localhost:4200',
      audience: 'https://gayness-scale-api.com'
    }
  }
}; 