import { useCallback, useRef } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { currentMonitor, LogicalPosition } from '@tauri-apps/api/window';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationOptions {
  title: string;
  body: string;
  type?: NotificationType;
  playSound?: boolean;
  showSystemNotification?: boolean;
}

const SOUND_ENABLED_KEY = 'notification_sound_enabled';
const SYSTEM_NOTIFICATION_KEY = 'system_notification_enabled';
const APP_POPUP_ENABLED_KEY = 'native_popup_enabled';
const POPUP_WINDOW_LABEL = 'native-notification-popup';

export function useNotification() {
  const audioContext = useRef<AudioContext | null>(null);

  // Inicializar AudioContext solo cuando se necesite
  const getAudioContext = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext.current;
  }, []);

  // Obtener configuración de sonido
  const getSoundEnabled = useCallback(() => {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored === null ? true : stored === 'true';
  }, []);

  // Obtener configuración de notificaciones del sistema
  const getSystemNotificationEnabled = useCallback(() => {
    const appPopupStored = localStorage.getItem(APP_POPUP_ENABLED_KEY);
    if (appPopupStored !== null) return appPopupStored === 'true';

    const stored = localStorage.getItem(SYSTEM_NOTIFICATION_KEY);
    return stored === null ? true : stored === 'true';
  }, []);

  // Generar tono de notificación
  const playTone = useCallback((frequency: number, duration: number = 150, volume: number = 0.3) => {
    if (!getSoundEnabled()) return;

    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [getAudioContext, getSoundEnabled]);

  // Reproducir sonido según el tipo
  const playNotificationSound = useCallback((type: NotificationType) => {
    switch (type) {
      case 'success':
        // Tono ascendente (Do - Mi - Sol)
        playTone(523.25, 100, 0.2); // Do
        setTimeout(() => playTone(659.25, 100, 0.2), 100); // Mi
        setTimeout(() => playTone(783.99, 150, 0.25), 200); // Sol
        break;
      case 'error':
        // Tono descendente grave (La - Fa)
        playTone(440, 120, 0.3); // La
        setTimeout(() => playTone(349.23, 180, 0.35), 120); // Fa
        break;
      case 'warning':
        // Dos tonos iguales (Si - Si)
        playTone(493.88, 100, 0.25); // Si
        setTimeout(() => playTone(493.88, 100, 0.25), 150); // Si
        break;
      case 'info':
        // Tono único suave (La)
        playTone(440, 150, 0.2); // La
        break;
    }
  }, [playTone]);

  // Mantener API de permisos por compatibilidad (popup nativo no requiere permiso OS)
  const checkAndRequestPermission = useCallback(async () => {
    return true;
  }, []);

  // Mostrar popup nativo de la app (independiente de notificaciones de Windows)
  const showNativePopup = useCallback(async (title: string, body: string, type: NotificationType) => {
    if (!getSystemNotificationEnabled()) return;

    try {
      const existingPopup = await WebviewWindow.getByLabel(POPUP_WINDOW_LABEL);
      if (existingPopup) {
        await existingPopup.close();
      }

      const width = 380;
      const height = 118;
      const margin = 16;

      const monitor = await currentMonitor();
      const scaleFactor = monitor?.scaleFactor || 1;
      const workArea = monitor?.workArea;

      const workX = workArea ? workArea.position.x / scaleFactor : 0;
      const workY = workArea ? workArea.position.y / scaleFactor : 0;
      const workWidth = workArea ? workArea.size.width / scaleFactor : 1366;
      const workHeight = workArea ? workArea.size.height / scaleFactor : 768;

      const x = Math.round(workX + workWidth - width - margin);
      const y = Math.round(workY + workHeight - height - margin);

      const popupUrl = `/notification-popup.html?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&type=${encodeURIComponent(type)}`;

      const popup = new WebviewWindow(POPUP_WINDOW_LABEL, {
        url: popupUrl,
        width,
        height,
        decorations: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        minimizable: false,
        maximizable: false,
        closable: true,
        focus: false,
        visible: true,
      });

      popup.once('tauri://created', async () => {
        try {
          await popup.setPosition(new LogicalPosition(x, y));
          setTimeout(() => {
            void popup.close();
          }, 5000);
        } catch (positionError) {
          console.error('Error positioning popup:', positionError);
        }
      });

      popup.once('tauri://error', (e) => {
        console.error('Error creating native popup:', e);
      });
    } catch (error) {
      console.error('Error showing native popup:', error);
    }
  }, [getSystemNotificationEnabled]);

  // Notificación principal
  const notify = useCallback(async ({
    title,
    body,
    type = 'info',
    playSound = true,
    showSystemNotification = true,
  }: NotificationOptions) => {
    // Reproducir sonido
    if (playSound) {
      playNotificationSound(type);
    }

    // Mostrar notificación del sistema
    if (showSystemNotification) {
      await showNativePopup(title, body, type);
    }
  }, [playNotificationSound, showNativePopup]);

  // Métodos de conveniencia
  const success = useCallback((title: string, body: string, options?: Partial<NotificationOptions>) => {
    return notify({ title, body, type: 'success', ...options });
  }, [notify]);

  const error = useCallback((title: string, body: string, options?: Partial<NotificationOptions>) => {
    return notify({ title, body, type: 'error', ...options });
  }, [notify]);

  const warning = useCallback((title: string, body: string, options?: Partial<NotificationOptions>) => {
    return notify({ title, body, type: 'warning', ...options });
  }, [notify]);

  const info = useCallback((title: string, body: string, options?: Partial<NotificationOptions>) => {
    return notify({ title, body, type: 'info', ...options });
  }, [notify]);

  // Configuración
  const setSoundEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
  }, []);

  const setSystemNotificationEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(APP_POPUP_ENABLED_KEY, enabled.toString());
    localStorage.setItem(SYSTEM_NOTIFICATION_KEY, enabled.toString());
  }, []);

  return {
    notify,
    success,
    error,
    warning,
    info,
    playNotificationSound,
    checkAndRequestPermission,
    getSoundEnabled,
    getSystemNotificationEnabled,
    setSoundEnabled,
    setSystemNotificationEnabled,
  };
}
