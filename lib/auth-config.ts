export const authConfig = {
  issuer: process.env.AUTH_BASE_URL ?? "https://auth.subraatakumar.com",
  serverIssuer: process.env.AUTH_INTERNAL_URL ?? process.env.AUTH_BASE_URL ?? "https://auth.subraatakumar.com",
  clientId: process.env.AUTH_CLIENT_ID ?? "jobsearch-web",
  redirectUri: `${process.env.APP_URL ?? "http://localhost:3020"}/api/auth/callback`,
};

export const authEndpoints = {
  authorize: `${authConfig.issuer}/api/auth/oauth2/authorize`,
  token: `${authConfig.serverIssuer}/api/auth/oauth2/token`,
  userinfo: `${authConfig.serverIssuer}/api/auth/oauth2/userinfo`,
};
