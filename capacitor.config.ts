import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.projectaerodactyl.hub',
  appName: 'Project Aerodactyl',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#06070d',
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#06070d',
    },
  },
}

export default config
