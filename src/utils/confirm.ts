import { Alert, Platform } from 'react-native';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

/**
 * Cross-platform confirm. RN Alert is a no-op on web, so use window.confirm there.
 */
export const confirmAction = ({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
}: ConfirmOptions): Promise<boolean> => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      {
        text: cancelLabel,
        style: 'cancel',
        onPress: () => resolve(false),
      },
      {
        text: confirmLabel,
        style: 'destructive',
        onPress: () => resolve(true),
      },
    ]);
  });
};
