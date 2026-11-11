import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 560;
const INK = '#161616';
const MUTED = '#8E8E8E';
const AMOUNT = '#E23B48';
const MANDALA = '#C8C8C8';

const BOLD_FONT =
  'PlusJakartaSans_700Bold, "Plus Jakarta Sans", "Segoe UI", sans-serif';
const TEXT_FONT = 'PlusJakartaSans_500Medium, "Segoe UI", sans-serif';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface PetalRing {
  count: number;
  inner: number;
  length: number;
  width: number;
  rotation: number;
}

const PETAL_RINGS: PetalRing[] = [
  { count: 12, inner: 28, length: 248, width: 58, rotation: -Math.PI / 12 },
  { count: 12, inner: 22, length: 196, width: 46, rotation: Math.PI / 12 },
  { count: 16, inner: 16, length: 146, width: 32, rotation: 0 },
  { count: 10, inner: 8, length: 96, width: 24, rotation: Math.PI / 10 },
  { count: 8, inner: 0, length: 62, width: 18, rotation: Math.PI / 8 },
];

export interface PaymentReminderInput {
  amount: number;
  currencySymbol: string;
  contactPhone?: string;
  senderName: string;
  senderPhone?: string;
  date?: Date;
}

export type PaymentReminderShareResult = 'attached' | 'copied' | 'downloaded';

export class MissingPhoneError extends Error {
  constructor() {
    super('This contact has no phone number.');
    this.name = 'MissingPhoneError';
  }
}

interface ReminderCopy {
  title: string;
  amountLine: string;
  dateLine: string;
  sentBy: string;
  footer: string;
}

const canvasFont = (size: number, weight: 500 | 700) =>
  `${weight} ${size}px ${weight === 700 ? BOLD_FONT : TEXT_FONT}`;

function firstNameOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'DueTrack';
  return trimmed.split(/\s+/)[0];
}

function displayPhone(phone?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

function toWhatsAppDigits(phone?: string): string {
  let digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length < 8) return '';
  return digits;
}

function buildCopy(input: PaymentReminderInput): ReminderCopy {
  const date = input.date ?? new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  const amount = Math.abs(input.amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const senderName = input.senderName.trim() || 'DueTrack';
  const phone = displayPhone(input.senderPhone);

  return {
    title: 'Payment reminder for',
    amountLine: `${input.currencySymbol} ${amount}`,
    dateLine: `on ${day} ${month} ${year}`,
    sentBy: `Sent by ${firstNameOf(senderName)}`,
    footer: phone ? `${senderName} | ${phone}` : senderName,
  };
}

function requireWhatsAppDigits(phone?: string): string {
  const digits = toWhatsAppDigits(phone);
  if (!digits) throw new MissingPhoneError();
  return digits;
}

async function openWhatsAppChat(digits: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(`https://wa.me/${digits}`, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    await Linking.openURL(`whatsapp://send?phone=${digits}`);
  } catch {
    await Linking.openURL(`https://wa.me/${digits}`);
  }
}


export function buildReminderCaptureHtml(input: PaymentReminderInput): string {
  const copy = buildCopy(input);
  const payload = JSON.stringify({
    copy,
    rings: PETAL_RINGS,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    ink: INK,
    muted: MUTED,
    amount: AMOUNT,
    mandala: MANDALA,
  }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body style="margin:0;background:#ffffff;">
    <canvas id="card" width="${CARD_WIDTH * 2}" height="${CARD_HEIGHT * 2}"></canvas>
    <script>
      const spec = ${payload};
      const canvas = document.getElementById('card');
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, spec.width, spec.height);
      ctx.save();
      ctx.beginPath();
      const radius = 28;
      const width = spec.width;
      const height = spec.height;
      ctx.moveTo(radius, 0);
      ctx.arcTo(width, 0, width, height, radius);
      ctx.arcTo(width, height, 0, height, radius);
      ctx.arcTo(0, height, 0, 0, radius);
      ctx.arcTo(0, 0, width, 0, radius);
      ctx.closePath();
      ctx.clip();

      function strokePetal(inner, length, petalWidth) {
        const tip = inner + length;
        ctx.beginPath();
        ctx.moveTo(0, inner);
        ctx.bezierCurveTo(petalWidth, inner + length * 0.22, petalWidth * 0.78, inner + length * 0.68, 0, tip);
        ctx.bezierCurveTo(-petalWidth * 0.78, inner + length * 0.68, -petalWidth, inner + length * 0.22, 0, inner);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, inner + length * 0.16);
        ctx.bezierCurveTo(petalWidth * 0.42, inner + length * 0.38, petalWidth * 0.36, inner + length * 0.7, 0, inner + length * 0.9);
        ctx.bezierCurveTo(-petalWidth * 0.36, inner + length * 0.7, -petalWidth * 0.42, inner + length * 0.38, 0, inner + length * 0.16);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(spec.width - 6, 8);
      ctx.strokeStyle = spec.mandala;
      ctx.lineWidth = 1.25;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      spec.rings.forEach((ring) => {
        for (let index = 0; index < ring.count; index += 1) {
          ctx.save();
          ctx.rotate(ring.rotation + (index * Math.PI * 2) / ring.count);
          strokePetal(ring.inner, ring.length, ring.width);
          ctx.restore();
        }
      });
      [22, 38, 54].forEach((circleRadius) => {
        ctx.beginPath();
        ctx.arc(0, 0, circleRadius, 0, Math.PI * 2);
        ctx.stroke();
      });
      for (let index = 0; index < 14; index += 1) {
        const angle = (index / 14) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 74, Math.sin(angle) * 74, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      function fillCentered(text, y, size, weight, color, maxWidth) {
        let next = size;
        ctx.fillStyle = color;
        ctx.font = weight + ' ' + next + 'px sans-serif';
        while (next > 16 && ctx.measureText(text).width > maxWidth) {
          next -= 1;
          ctx.font = weight + ' ' + next + 'px sans-serif';
        }
        ctx.fillText(text, spec.width / 2, y);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fillCentered(spec.copy.title, 168, 40, 700, spec.ink, 760);
      fillCentered(spec.copy.amountLine, 242, 64, 700, spec.amount, 760);
      fillCentered(spec.copy.dateLine, 300, 22, 500, spec.muted, 760);
      fillCentered(spec.copy.sentBy, 430, 34, 700, spec.ink, 860);
      fillCentered(spec.copy.footer, 474, 22, 500, spec.muted, 860);
      ctx.restore();

      window.renderReminder = function () {
        const dataUrl = canvas.toDataURL('image/png');
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(dataUrl);
        }
      };
      (function waitForBridge(tries) {
        if (window.ReactNativeWebView) {
          window.renderReminder();
          return;
        }
        if (tries > 40) return;
        setTimeout(function () { waitForBridge(tries + 1); }, 50);
      })(0);
    </script>
  </body>
</html>`;
}

function traceRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function strokePetal(ctx: CanvasRenderingContext2D, inner: number, length: number, width: number) {
  const tip = inner + length;
  ctx.beginPath();
  ctx.moveTo(0, inner);
  ctx.bezierCurveTo(width, inner + length * 0.22, width * 0.78, inner + length * 0.68, 0, tip);
  ctx.bezierCurveTo(-width * 0.78, inner + length * 0.68, -width, inner + length * 0.22, 0, inner);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, inner + length * 0.16);
  ctx.bezierCurveTo(
    width * 0.42,
    inner + length * 0.38,
    width * 0.36,
    inner + length * 0.7,
    0,
    inner + length * 0.9,
  );
  ctx.bezierCurveTo(
    -width * 0.36,
    inner + length * 0.7,
    -width * 0.42,
    inner + length * 0.38,
    0,
    inner + length * 0.16,
  );
  ctx.stroke();
}

function drawMandala(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = MANDALA;
  ctx.lineWidth = 1.25;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  PETAL_RINGS.forEach((ring) => {
    for (let index = 0; index < ring.count; index += 1) {
      ctx.save();
      ctx.rotate(ring.rotation + (index * Math.PI * 2) / ring.count);
      strokePetal(ctx, ring.inner, ring.length, ring.width);
      ctx.restore();
    }
  });

  [22, 38, 54].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  for (let index = 0; index < 14; index += 1) {
    const angle = (index / 14) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * 74, Math.sin(angle) * 74, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function fillCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  size: number,
  weight: 500 | 700,
  color: string,
  maxWidth: number,
) {
  let nextSize = size;
  ctx.fillStyle = color;
  ctx.font = canvasFont(nextSize, weight);
  while (nextSize > 16 && ctx.measureText(text).width > maxWidth) {
    nextSize -= 1;
    ctx.font = canvasFont(nextSize, weight);
  }
  ctx.fillText(text, CARD_WIDTH / 2, y);
}

function renderPaymentReminderPng(copy: ReminderCopy): Blob {
  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = CARD_WIDTH * scale;
  canvas.height = CARD_HEIGHT * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not draw the payment reminder.');
  }

  ctx.scale(scale, scale);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  traceRoundRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, 28);
  ctx.save();
  ctx.clip();
  drawMandala(ctx, CARD_WIDTH - 6, 8);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fillCentered(ctx, copy.title, 168, 40, 700, INK, 760);
  fillCentered(ctx, copy.amountLine, 242, 64, 700, AMOUNT, 760);
  fillCentered(ctx, copy.dateLine, 300, 22, 500, MUTED, 760);
  fillCentered(ctx, copy.sentBy, 430, 34, 700, INK, 860);
  fillCentered(ctx, copy.footer, 474, 22, 500, MUTED, 860);
  ctx.restore();

  return dataUrlToBlob(canvas.toDataURL('image/png'));
}

function dataUrlToBlob(dataUrl: string): Blob {
  const base64 = dataUrl.split(',')[1] ?? '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: 'image/png' });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function startImageCopy(blob: Blob): Promise<boolean> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.clipboard?.write ||
    typeof ClipboardItem === 'undefined'
  ) {
    return Promise.resolve(false);
  }

  return navigator.clipboard
    .write([new ClipboardItem({ 'image/png': blob })])
    .then(() => true)
    .catch(() => false);
}

async function shareReminderOnWeb(input: PaymentReminderInput): Promise<PaymentReminderShareResult> {
  const digits = requireWhatsAppDigits(input.contactPhone);
  const copy = buildCopy(input);
  const blob = renderPaymentReminderPng(copy);
  const copyPromise = startImageCopy(blob);
  await openWhatsAppChat(digits);
  const copied = await copyPromise;
  if (copied) return 'copied';

  downloadBlob(blob, 'payment-reminder.png');
  return 'downloaded';
}

const FLAG_GRANT_READ_URI_PERMISSION = 1;

const WHATSAPP_ACTIVITIES = [
  { packageName: 'com.whatsapp', className: 'com.whatsapp.contact.picker.ContactPicker' },
  { packageName: 'com.whatsapp', className: 'com.whatsapp.ContactPicker' },
  { packageName: 'com.whatsapp.w4b', className: 'com.whatsapp.contact.picker.ContactPicker' },
  { packageName: 'com.whatsapp.w4b', className: 'com.whatsapp.ContactPicker' },
];

type WhatsAppImageShareModule = {
  shareImage(contentUri: string, phoneDigits: string): Promise<void>;
};

function getWhatsAppImageShare(): WhatsAppImageShareModule | null {
  const modules = (
    globalThis as { expo?: { modules?: Record<string, WhatsAppImageShareModule> } }
  ).expo?.modules;
  const native = modules?.WhatsAppImageShare;
  if (!native?.shareImage) return null;
  return native;
}

function launchWhatsAppIntent(params: IntentLauncher.IntentLauncherParams): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (opened: boolean) => {
      if (settled) return;
      settled = true;
      resolve(opened);
    };

    const timer = setTimeout(() => finish(true), 500);
    IntentLauncher.startActivityAsync('android.intent.action.SEND', params).then(
      () => {
        clearTimeout(timer);
        finish(true);
      },
      () => {
        clearTimeout(timer);
        finish(false);
      },
    );
  });
}

async function openWhatsAppImageIntent(contentUri: string, digits: string): Promise<boolean> {
  const jid = `${digits}@s.whatsapp.net`;

  for (const target of WHATSAPP_ACTIVITIES) {
    const opened = await launchWhatsAppIntent({
      type: 'image/png',
      data: contentUri,
      flags: FLAG_GRANT_READ_URI_PERMISSION,
      category: 'android.intent.category.DEFAULT',
      packageName: target.packageName,
      className: target.className,
      extra: {
        'android.intent.extra.STREAM': contentUri,
        jid,
      },
    });
    if (opened) return true;
  }

  return false;
}

async function attachReminderOnAndroid(base64: string, digits: string): Promise<boolean> {
  const directory = FileSystem.cacheDirectory;
  if (!directory) return false;

  const fileUri = `${directory}payment-reminder.png`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const contentUri = await FileSystem.getContentUriAsync(fileUri);
  const nativeShare = getWhatsAppImageShare();

  if (nativeShare) {
    try {
      await nativeShare.shareImage(contentUri, digits);
      return true;
    } catch {
      // Expo Go does not include the native helper. Fall through to the intent.
    }
  }

  return openWhatsAppImageIntent(contentUri, digits);
}

async function shareReminderOnNative(
  input: PaymentReminderInput,
  pngDataUrl: string,
): Promise<PaymentReminderShareResult> {
  const digits = requireWhatsAppDigits(input.contactPhone);
  const base64 = pngDataUrl.includes(',') ? (pngDataUrl.split(',')[1] ?? '') : pngDataUrl;
  if (!base64) {
    throw new Error('Could not create the reminder image.');
  }

  if (Platform.OS === 'android') {
    try {
      await Clipboard.setImageAsync(base64);
    } catch {
      // Attaching the file does not depend on the clipboard.
    }

    try {
      const attached = await attachReminderOnAndroid(base64, digits);
      if (attached) return 'attached';
    } catch {
      // Keep the chat path available when the file cannot be attached.
    }
  }

  await Clipboard.setImageAsync(base64);
  await openWhatsAppChat(digits);
  return 'copied';
}

export async function sharePaymentReminder(
  input: PaymentReminderInput,
  nativePngDataUrl?: string,
): Promise<PaymentReminderShareResult> {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return shareReminderOnWeb(input);
  }
  if (!nativePngDataUrl) {
    throw new Error('Could not create the reminder image.');
  }
  return shareReminderOnNative(input, nativePngDataUrl);
}
