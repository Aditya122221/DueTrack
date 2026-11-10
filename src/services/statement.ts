import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { Contact, Transaction, TransactionType } from '../types';

const cleanPhoneDigits = (phone?: string) => (phone || '').replace(/[^0-9+]/g, '');

const digitsOnlyPhone = (phone?: string) => (phone || '').replace(/[^0-9]/g, '');

const formatMessageAmount = (value: number): string => {
  const abs = Math.abs(value);
  const formatted = Number.isInteger(abs)
    ? abs.toLocaleString('en-IN')
    : abs.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
};

const formatEntryDate = (date: Date = new Date()): string =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export const generateEntryMessage = ({
  type,
  amount,
  currencyLabel = 'Rs',
  netBalance = 0,
  senderName,
  date,
}: {
  type: TransactionType;
  amount: number;
  currencyLabel?: string;
  netBalance?: number;
  senderName?: string;
  date?: Date | string;
}): string => {
  const entryDate = date ? new Date(date) : new Date();
  // GAVE increases what they owe (+), GOT reduces it / you owe (-)
  const signedEntry = type === 'GAVE' ? amount : -amount;
  const name = senderName?.trim() || 'DueTrack';

  return `Hi, Entry added for ${currencyLabel} ${formatMessageAmount(signedEntry)} on ${formatEntryDate(entryDate)}. Total dues : ${currencyLabel} ${formatMessageAmount(netBalance)}.\n\nThank you\n${name}`;
};
export const openWhatsAppWithMessage = async (phone: string | undefined, text: string) => {
  const cleanPhone = digitsOnlyPhone(phone);
  const encoded = encodeURIComponent(text);
  const appUrl = cleanPhone
    ? `whatsapp://send?phone=${cleanPhone}&text=${encoded}`
    : `whatsapp://send?text=${encoded}`;
  const webUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  try {
    await Linking.openURL(appUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
};

export const openSmsWithMessage = async (phone: string | undefined, text: string) => {
  const cleanPhone = cleanPhoneDigits(phone);
  const encoded = encodeURIComponent(text);
  // iOS uses `&body=`, Android uses `?body=`
  const url = Platform.select({
    ios: cleanPhone ? `sms:${cleanPhone}&body=${encoded}` : `sms:&body=${encoded}`,
    default: cleanPhone ? `sms:${cleanPhone}?body=${encoded}` : `sms:?body=${encoded}`,
  }) as string;

  await Linking.openURL(url);
};

async function logoDataUri(): Promise<string> {
  const asset = Asset.fromModule(require('../../assets/logo.png'));
  if (!asset.localUri) {
    await asset.downloadAsync();
  }
  const uri = asset.localUri ?? asset.uri;
  if (!uri) return '';
  if (uri.startsWith('data:')) return uri;

  const fetchable =
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('blob:') ||
    uri.startsWith('/');

  if (fetchable) {
    const absolute =
      uri.startsWith('/') && typeof window !== 'undefined'
        ? `${window.location.origin}${uri}`
        : uri;
    const response = await fetch(absolute);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/png;base64,${base64}`;
}

export const generateReminderMessage = (
  contact: Contact,
  currencySymbol: string
): string => {
  const net = contact.net_balance || 0;
  if (net > 0) {
    return `Hello ${contact.name},\n\nThis is a polite reminder from DueTrack regarding the pending balance of ${currencySymbol}${net.toLocaleString('en-IN')}.\n\nPlease let me know when you can settle this.\n\nThank you!`;
  } else if (net < 0) {
    return `Hello ${contact.name},\n\nAccording to my DueTrack records, I owe you ${currencySymbol}${Math.abs(net).toLocaleString('en-IN')}. Please share your payment details/UPI so I can clear it.\n\nThank you!`;
  }
  return `Hello ${contact.name},\n\nAll accounts between us are fully settled on DueTrack.\n\nThank you!`;
};

export const sendReminderViaWhatsApp = async (
  contact: Contact,
  currencySymbol: string
) => {
  const text = generateReminderMessage(contact, currencySymbol);
  await openWhatsAppWithMessage(contact.phone, text);
};

export const exportLedgerPdf = async (
  contact: Contact,
  transactions: Transaction[],
  currencySymbol: string
) => {
  const net = contact.net_balance || 0;
  const statusLabel =
    net > 0
      ? `Pending to Receive: ${currencySymbol}${net.toLocaleString('en-IN')}`
      : net < 0
      ? `Pending to Pay: ${currencySymbol}${Math.abs(net).toLocaleString('en-IN')}`
      : 'Account Fully Settled';

  const rowsHtml = transactions
    .map((t) => {
      const isGave = t.type === 'GAVE';
      const formattedDate = new Date(t.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const color = isGave ? '#E06D53' : '#4EBA87';
      const typeLabel = isGave ? 'YOU GAVE' : 'YOU GOT';

      return `
        <tr style="border-bottom: 1px solid #292929;">
          <td style="padding: 12px 8px; font-size: 13px; color: #A9A398;">${formattedDate}</td>
          <td style="padding: 12px 8px; font-size: 13px; color: #F5F1E8; font-weight: 500;">
            ${t.note || (isGave ? 'Money given' : 'Payment received')}
          </td>
          <td style="padding: 12px 8px; font-size: 12px; font-weight: 600; color: ${color};">
            <span style="background: ${isGave ? 'rgba(224,109,83,0.15)' : 'rgba(78,186,135,0.15)'}; padding: 4px 8px; border-radius: 4px;">
              ${typeLabel}
            </span>
          </td>
          <td style="padding: 12px 8px; font-size: 14px; font-weight: 700; text-align: right; color: ${color};">
            ${isGave ? '+' : '-'}${currencySymbol}${Number(t.amount).toLocaleString('en-IN')}
          </td>
        </tr>
      `;
    })
    .join('');

  const logoSrc = await logoDataUri();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>DueTrack Statement - ${contact.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700&family=Sora:wght@600;700&display=swap');
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
            background-color: #171717;
            color: #F5F1E8;
            margin: 0;
            padding: 36px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #C6A56B;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .logo {
            width: 56px;
            height: 56px;
            object-fit: contain;
          }
          .tagline {
            font-size: 11px;
            color: #A9A398;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 4px;
          }
          .card {
            background-color: #242424;
            border: 1px solid #333333;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
          }
          .balance-badge {
            display: inline-block;
            background-color: rgba(198, 165, 107, 0.15);
            border: 1px solid #C6A56B;
            color: #C6A56B;
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            text-align: left;
            padding: 10px 8px;
            font-size: 11px;
            color: #C6A56B;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            border-bottom: 1px solid #333333;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #736E66;
            border-top: 1px solid #292929;
            padding-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <img class="logo" src="${logoSrc}" alt="" />
            <div class="tagline">Luxury Private Debt & Ledger Statement</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #A9A398;">Statement Date</div>
            <div style="font-size: 14px; font-weight: 600;">${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</div>
          </div>
        </div>

        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 12px; color: #A9A398; text-transform: uppercase;">Account Holder</div>
              <div style="font-size: 20px; font-weight: 700; margin-top: 4px; color: #F5F1E8;">${contact.name}</div>
              <div style="font-size: 13px; color: #A9A398; margin-top: 2px;">
                ${contact.phone ? `Phone: ${contact.phone}` : ''} | Relation: ${contact.relationship}
              </div>
            </div>
            <div>
              <div class="balance-badge">${statusLabel}</div>
            </div>
          </div>
        </div>

        <div style="font-size: 14px; font-weight: 700; color: #C6A56B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          Transaction Ledger (${transactions.length} records)
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description / Reference</th>
              <th>Type</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Generated securely via DueTrack · Obsidian & Champagne Fintech
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `DueTrack Statement - ${contact.name}`,
      });
    }
  } catch (error) {
    console.warn('Failed to export statement:', error);
  }
};

