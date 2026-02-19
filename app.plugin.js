const { withAndroidManifest, withAppBuildGradle } = require('@expo/config-plugins');

const withWifiReborn = (config) => {
  // Ajouter les permissions Android
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // S'assurer que uses-permission existe
    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    const permissions = [
      'android.permission.ACCESS_WIFI_STATE',
      'android.permission.CHANGE_WIFI_STATE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.CHANGE_NETWORK_STATE',
      'android.permission.ACCESS_NETWORK_STATE',
    ];

    permissions.forEach((permission) => {
      if (!androidManifest['uses-permission'].find((item) => item.$?.['android:name'] === permission)) {
        androidManifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    });

    return config;
  });

  return config;
};

module.exports = withWifiReborn;