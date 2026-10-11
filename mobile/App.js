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
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';

const APP_URL = 'https://34-64-159-225.sslip.io';
const THEME_COLOR = '#8b3e4b';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const lastBackPressed = useRef(0);

  // 앱 시작 시 카메라 및 앨범 권한 사전 요청
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        try {
          await ImagePicker.requestCameraPermissionsAsync();
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        } catch (err) {
          console.warn('Permission request error:', err);
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

    // 루트 화면에서 뒤로가기 두 번 누르면 종료
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

  // 웹뷰로부터 네이티브 카메라/앨범 요청 수신 처리
  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'OPEN_CAMERA') {
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
      } else if (data.type === 'OPEN_GALLERY') {
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
