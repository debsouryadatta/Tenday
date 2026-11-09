import * as SplashScreen from 'expo-splash-screen';

/**
 * Startup control. The native splash (Carefold on ink) stays up until the
 * first real screen has rendered, so users never see a blank window while
 * fonts load and the signed-in session is restored.
 */
void SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 220 });

let hidden = false;
export function hideSplash() {
  if (hidden) return;
  hidden = true;
  SplashScreen.hide();
}
