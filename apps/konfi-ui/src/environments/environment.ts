export const environment = {
  production: true,
  backendUrl: '/',
  getHostnameForWS: () => {
    return window.location.hostname;
  }
};
