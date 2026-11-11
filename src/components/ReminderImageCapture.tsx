import React, { useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import {
  buildReminderCaptureHtml,
  PaymentReminderInput,
} from '../services/paymentReminder';

interface ReminderImageCaptureProps {
  input: PaymentReminderInput | null;
  attempt: number;
  onImage: (dataUrl: string) => void;
  onError: (message: string) => void;
}

export function ReminderImageCapture({
  input,
  attempt,
  onImage,
  onError,
}: ReminderImageCaptureProps) {
  const deliveredAttempt = useRef(-1);

  if (Platform.OS === 'web' || !input) return null;

  const html = buildReminderCaptureHtml(input);

  const handleMessage = (event: WebViewMessageEvent) => {
    if (deliveredAttempt.current === attempt) return;
    const data = event.nativeEvent.data;
    deliveredAttempt.current = attempt;
    if (!data.startsWith('data:image/png')) {
      onError(data || 'Could not create the reminder image.');
      return;
    }
    onImage(data);
  };

  return (
    <WebView
      key={`${attempt}`}
      originWhitelist={['*']}
      source={{ html }}
      onMessage={handleMessage}
      onError={() => {
        if (deliveredAttempt.current === attempt) return;
        deliveredAttempt.current = attempt;
        onError('Could not create the reminder image.');
      }}
      injectedJavaScript="window.renderReminder && window.renderReminder(); true;"
      javaScriptEnabled
      scrollEnabled={false}
      style={styles.hidden}
    />
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    left: -4000,
    top: 0,
    width: 1200,
    height: 560,
    opacity: 0,
  },
});
