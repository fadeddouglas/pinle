import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

export async function bootNativeShell(): Promise<void> {
  if (!isNativeApp()) {
    return
  }

  document.documentElement.classList.add('native-app')

  try {
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setBackgroundColor({ color: '#0d3a1c' })
    await StatusBar.setStyle({ style: Style.Dark })
  } catch {
    /* Status bar styling is best-effort on each platform */
  }

  try {
    await SplashScreen.hide()
  } catch {
    /* Splash may already be gone */
  }
}
