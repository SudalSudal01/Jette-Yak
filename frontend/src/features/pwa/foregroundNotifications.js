const NOTIFICATION_ICON = '/pwa/icon-192.png';
const SERVICE_WORKER_PATH = '/sw.js';

// 열린 앱의 알림만 표시하고 권한 요청은 사용자 클릭 핸들러에 맡김
export async function showForegroundNotification(title, options = {}, browser = globalThis) {
  try {
    // React Native WebView 환경인 경우 네이티브 푸시 알림으로 즉시 전달
    if (browser.ReactNativeWebView) {
      browser.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'SHOW_NOTIFICATION',
        title: title || '제때약 복약 알림',
        body: options?.body || '확인할 복약 알림이 있어요.',
        data: options?.data || {}
      }));
      return true;
    }

    const NotificationApi = browser.Notification;
    if (!NotificationApi || NotificationApi.permission !== 'granted') return false;

    const notificationOptions = { ...options, icon: NOTIFICATION_ICON };

    try {
      const serviceWorker = browser.navigator?.serviceWorker;
      if (typeof serviceWorker?.getRegistration === 'function') {
        // 등록이 없을 때 끝나지 않는 ready 대기를 피하고 현재 등록만 확인
        const registration = await serviceWorker.getRegistration('/');
        const activeWorker = registration?.active;
        const origin = browser.location?.origin;
        if (activeWorker && origin && typeof registration.showNotification === 'function') {
          const scriptUrl = new URL(activeWorker.scriptURL, origin);
          if (scriptUrl.origin === origin && scriptUrl.pathname === SERVICE_WORKER_PATH) {
            await registration.showNotification(title, notificationOptions);
            return true;
          }
        }
      }
    } catch {
      // 서비스 워커 실패 시 지원되는 브라우저의 생성자로 한 번 더 시도
    }

    if (NotificationApi.permission !== 'granted') return false;
    new NotificationApi(title, notificationOptions);
    return true;
  } catch {
    // 모바일 생성자 오류도 모달과 앱 내부 알림 흐름을 막지 않음
    return false;
  }
}
