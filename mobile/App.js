import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  Platform,
  BackHandler,
  ToastAndroid,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  LogBox,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';

// 경고창(Warning) 무시 (프로덕션 뷰와 동일하게 유지)
LogBox.ignoreAllLogs();

// 앱이 켜져 있는 동안에도 상단 배너 알림과 소리를 띄우도록 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const APP_URL = 'https://34-64-159-225.sslip.io';
const THEME_COLOR = '#8b3e4b';
const NOTIFICATION_CHANNEL_ID = 'jette-yak-channel';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const lastBackPressed = useRef(0);

  // 앱 시작 시 카메라, 갤러리 및 네이티브 푸시 알림 채널/권한 등록
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        try {
          await ImagePicker.requestCameraPermissionsAsync();
          await ImagePicker.requestMediaLibraryPermissionsAsync();

          // 네이티브 알림 권한 요청
          await Notifications.requestPermissionsAsync();

          // 안드로이드 고유 알림 채널(헤드업 알림, 소리, 진동) 생성
          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
              name: '제때약 복약 알림',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: THEME_COLOR,
              sound: 'default',
            });
          }
        } catch (err) {
          console.warn('Initialization error:', err);
        }
      }
    })();
  }, []);

  // 안드로이드 하드웨어 뒤로가기 버튼 처리
  const handleBackPress = useCallback(() => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }

    const now = Date.now();
    if (now - lastBackPressed.current < 2000) {
      BackHandler.exitApp();
      return true;
    }

    lastBackPressed.current = now;
    if (Platform.OS === 'android') {
      ToastAndroid.show('뒤로 가기 버튼을 한 번 더 누르면 종료됩니다.', ToastAndroid.SHORT);
    }
    return true;
  }, [canGoBack]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove();
    }
  }, [handleBackPress]);

  // 웹뷰로부터 메시지 수신 (카메라, 갤러리, 알림 발송)
  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      // 1. 네이티브 알림 띄우기
      if (data.type === 'SHOW_NOTIFICATION') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: data.title || '제때약 알림',
            body: data.body || '확인할 복약 일정이 있습니다.',
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
            channelId: NOTIFICATION_CHANNEL_ID,
          },
          trigger: null, // 즉시 상단 바에 알림 띄우기
        });
      }
      // 2. 네이티브 카메라 실행
      else if (data.type === 'OPEN_CAMERA') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('권한 필요', '처방전 촬영을 위해 카메라 권한을 허용해 주세요.');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: false,
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const asset = result.assets[0];
          const mime = asset.mimeType || 'image/jpeg';
          const b64 = asset.base64;
          const fileName = asset.fileName || 'camera_rx.jpg';
          const jsCode = `
            if (window.__onNativeImageReceived) {
              window.__onNativeImageReceived("data:${mime};base64,${b64}", "${fileName}");
            }
            true;
          `;
          webViewRef.current?.injectJavaScript(jsCode);
        }
      }
      // 3. 네이티브 갤러리 실행
      else if (data.type === 'OPEN_GALLERY') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('권한 필요', '사진 선택을 위해 미디어 라이브러리 권한을 허용해 주세요.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const asset = result.assets[0];
          const mime = asset.mimeType || 'image/jpeg';
          const b64 = asset.base64;
          const fileName = asset.fileName || 'gallery_rx.jpg';
          const jsCode = `
            if (window.__onNativeImageReceived) {
              window.__onNativeImageReceived("data:${mime};base64,${b64}", "${fileName}");
            }
            true;
          `;
          webViewRef.current?.injectJavaScript(jsCode);
        }
      }
    } catch (err) {
      console.warn('onMessage error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />

      {hasError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>네트워크 연결 오류</Text>
          <Text style={styles.errorDesc}>인터넷 연결 상태를 확인한 후 다시 시도해 주세요.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setHasError(false);
              webViewRef.current?.reload();
            }}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: APP_URL }}
          style={styles.webview}
          onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
          onError={() => setHasError(true)}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={THEME_COLOR} />
            </View>
          )}
          startInLoadingState={true}
          pullToRefreshEnabled={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
          allowsFullscreenVideo={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="compatibility"
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          mediaCapturePermissionGrantType="grant"
          onPermissionRequest={(event) => {
            event.grant(event.resources);
          }}
          javaScriptCanOpenWindowsAutomatically={true}
          originWhitelist={['*']}
          applicationNameForUserAgent="JetteYakApp"
          onMessage={handleMessage}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLOR,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
