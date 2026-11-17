/**
 * Completa o app.json com o que não pode ir pro git.
 * GOOGLE_MAPS_ANDROID_API_KEY: sem ela o mapa (aba Lugares) fica cinza no Android.
 * No EAS: `eas env:create --name GOOGLE_MAPS_ANDROID_API_KEY --value ...`
 * (no iOS o mapa é o Apple Maps e não precisa de chave).
 */
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY }],
  ],
});
