const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withLocalSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    const marker = '// Tenday local release signing';
    if (!mod.modResults.contents.includes(marker))
      mod.modResults.contents += `
${marker}
def tendaySigningPath = System.getenv('TENDAY_SIGNING_PROPERTIES')
if (tendaySigningPath) {
    def tendaySigning = new Properties()
    new File(tendaySigningPath).withInputStream { tendaySigning.load(it) }
    android.signingConfigs.create('tendayRelease') {
        storeFile file(tendaySigning.getProperty('storeFile'))
        storePassword tendaySigning.getProperty('storePassword')
        keyAlias tendaySigning.getProperty('keyAlias')
        keyPassword tendaySigning.getProperty('keyPassword')
    }
    android.buildTypes.release.signingConfig = android.signingConfigs.tendayRelease
}
`;
    return mod;
  });
};
