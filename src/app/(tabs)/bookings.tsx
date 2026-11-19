import { useCallback, useState, useEffect, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from 'react-native';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../../lib/firebase';

import {
  getUserBookings,
  updateUserBooking,
} from '@/utils/firestoreBookingStorage';

import AnimatedButton from '@/components/animated-button';
import AnimatedCard from '@/components/animated-card';

type QuotationItem = {
  description: string;
  amount: number;
};

type Quotation = {
  version?: number;
  items?: QuotationItem[];
  totalAmount?: number;
  workDescription?: string;
  estimatedDuration?: string;
  warranty?: string;
  createdAt?: string;
};

type BookingItem = {
  id: string;
  service: string;
  district: string;
  city: string;
  area: string;
  preferredDate: string;
  preferredTime: string;
  status: string;
  hasReview?: boolean;
  createdAt?: string | number;

  quotation?: Quotation | null;
  quotationHistory?: Quotation[];
  quotationStatus?: string;
  quotationResponseAt?: string | null;

  [key: string]: any;
};

type FilterType =
  | 'All'
  | 'Pending'
  | 'Approved'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

const filters: FilterType[] = [
  'All',
  'Pending',
  'Approved',
  'Completed',
  'Rejected',
  'Cancelled',
];

const hiddenFields = [
  'id',
  'service',
  'district',
  'city',
  'area',
  'preferredDate',
  'preferredTime',
  'status',
  'createdAt',
  'userId',
  'hasReview',
  'quotation',
  'quotationHistory',
  'quotationStatus',
  'quotationResponseAt',
];

const labels: Record<string, string> = {
  name: 'Customer Name',
  address: 'Full Address',
  landmark: 'Landmark',
  additionalRequirements: 'Additional Requirements',
  propertyType: 'Property Type',
  cleaningType: 'Cleaning Type',
  bedrooms: 'Number of Bedrooms',
  bathrooms: 'Number of Bathrooms',
  problemType: 'Problem Type',
  numberOfIssues: 'Number of Issues',
  urgency: 'Urgency',
  workType: 'Work Type',
  electricalPoints: 'Number of Electrical Points',
  electricalUrgency: 'Urgency',
  paintingProperty: 'Property Type',
  paintingType: 'Painting Type',
  houseArea: 'House Area (sq.ft.)',
  numberOfRooms: 'Number of Rooms',
  paintPreference: 'Paint Preference',
  acType: 'AC Type',
  acUnits: 'Number of AC Units',
  acServiceType: 'AC Service Type',
  maidRooms: 'Number of Rooms',
  maidBathrooms: 'Number of Bathrooms',
  cleaningFrequency: 'Cleaning Frequency',
  maidDuration: 'Preferred Duration',
  maidTasks: 'Housekeeping Tasks',
  peopleCount: 'Number of People',
  mealsRequired: 'Meals Required',
  cookingFrequency: 'Cooking Frequency',
  foodPreference: 'Food Preference',
  cookingRequirements: 'Special Cooking Requirements',
  carpentryWork: 'Carpentry Work Type',
  furnitureType: 'Furniture Type',
  furnitureDetails: 'Furniture Details',
  carpentryQuantity: 'Number of Items',
  gardenSize: 'Garden Size',
  gardeningWork: 'Gardening Work Type',
  plantCount: 'Number of Plants',
  gardeningFrequency: 'Maintenance Frequency',
  pestType: 'Pest Type',
  affectedArea: 'Affected Area',
  pestPropertyType: 'Property Type',
  pestSeverity: 'Pest Problem Level',
  applianceType: 'Appliance Type',
  applianceBrand: 'Appliance Brand',
  applianceProblem: 'Problem Description',
  applianceQuantity: 'Number of Appliances',
};

const formatLabel = (key: string) => {
  if (labels[key]) {
    return labels[key];
  }

  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase());
};

const formatAmount = (amount: number | undefined) => {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
};

// ---------------------------------------------------------------
// Cross-platform dialogs.
// Alert.alert with buttons does NOT work on web (Vercel), so we use
// window.confirm / window.alert there and the native Alert on mobile.
// ---------------------------------------------------------------
type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

const confirmAction = ({
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
}: ConfirmOptions) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
};

// Simple one-button message that also works on web
const showMessage = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// Escape text so it is safe inside the PDF HTML
const escapeHtml = (text: unknown) =>
  String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Build the HTML used to generate the quotation PDF
const buildQuotationHtml = (
  item: BookingItem,
  quotation: Quotation,
  title = 'HomeEase Quotation'
) => {
  const rows = (quotation.items || [])
    .map(
      (q) => `
      <tr>
        <td>${escapeHtml(q.description)}</td>
        <td style="text-align:right;">${formatAmount(q.amount)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 28px; color: #392D28; }
        h1 { color: #B85D32; margin-bottom: 0; }
        .sub { color: #8C756A; margin-top: 4px; }
        h3 { margin-bottom: 4px; margin-top: 20px; color: #B85D32; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        td, th { padding: 9px 6px; border-bottom: 1px solid #EAD8C9; font-size: 14px; }
        th { text-align: left; background: #FFF1E5;
             -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .total { text-align: right; font-size: 18px; font-weight: bold;
                 color: #B85D32; margin-top: 14px; }
      </style>
    </head>
    <body>
      <h1>HomeEase</h1>
      <p class="sub">Your Home, Our Care.</p>
      <hr />

      <h3>Booking Details</h3>
      <p><b>Booking ID:</b> ${escapeHtml(item.id)}</p>
      <p><b>Service:</b> ${escapeHtml(item.service)}</p>
      <p><b>Date:</b> ${escapeHtml(item.preferredDate)} ${escapeHtml(item.preferredTime)}</p>

      <h3>Quotation #${quotation.version || 1}</h3>
      <p>${escapeHtml(quotation.workDescription || 'Not provided')}</p>

      <table>
        <tr><th>Work Item</th><th style="text-align:right;">Amount</th></tr>
        ${rows}
      </table>

      <div class="total">Total: ${formatAmount(quotation.totalAmount)}</div>

      <h3>Estimated Completion Time</h3>
      <p>${escapeHtml(quotation.estimatedDuration || 'Not provided')}</p>

      <h3>Warranty</h3>
      <p>${escapeHtml(quotation.warranty || 'Not specified')}</p>

      <h3>Status</h3>
      <p>${escapeHtml(item.quotationStatus || 'Sent')}</p>
    </body>
  </html>`;
};

function getFilterStatus(filter: FilterType): string[] {
  switch (filter) {
    case 'Pending':
      return ['Waiting for Provider Response'];
    case 'Approved':
      return ['Approved'];
    case 'Completed':
      return ['Completed'];
    case 'Rejected':
      return ['Rejected'];
    case 'Cancelled':
      return ['Cancelled'];
    default:
      return [];
  }
}

function BookingLoadingScreen() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [pulse]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[
          styles.loadingIconCircle,
          { transform: [{ scale: pulse }] },
        ]}
      >
        <Text style={styles.loadingHouse}>🏡</Text>
      </Animated.View>

      <Text style={styles.loadingBrand}>HomeEase</Text>

      <Text style={styles.loadingTagline}>
        Your Home, Our Care.
      </Text>

      <ActivityIndicator
        size="large"
        color="#B85D32"
        style={styles.loadingSpinner}
      />

      <Text style={styles.loadingMessage}>
        Loading your bookings...
      </Text>

      <Text style={styles.loadingSubtext}>
        Please wait a moment
      </Text>
    </View>
  );
}

export default function BookingsScreen() {
  const router = useRouter();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedBookingId, setExpandedBookingId] =
    useState<string | null>(null);

  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>('All');

  const [respondingQuotationId, setRespondingQuotationId] =
    useState<string | null>(null);

  const [downloadingPdfId, setDownloadingPdfId] =
    useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);

    try {
      await auth.authStateReady();

      const user = auth.currentUser;

      if (!user) {
        setBookings([]);
        router.replace('/auth');
        return;
      }

      const data = await getUserBookings(user.uid);

      const bookingsWithReviews = await Promise.all(
        (data as BookingItem[]).map(async (booking) => {
          if (booking.status !== 'Completed') {
            return {
              ...booking,
              hasReview: false,
            };
          }

          try {
            const reviewRef = doc(
              db,
              'users',
              user.uid,
              'bookings',
              booking.id,
              'reviews',
              'customerReview'
            );

            const reviewSnapshot = await getDoc(reviewRef);

            return {
              ...booking,
              hasReview: reviewSnapshot.exists(),
            };
          } catch (reviewError) {
            console.log('Review checking error:', reviewError);

            return {
              ...booking,
              hasReview: false,
            };
          }
        })
      );

      setBookings(
        [...bookingsWithReviews].reverse() as BookingItem[]
      );
    } catch (error) {
      console.log('Loading bookings error:', error);

      showMessage(
        'Error',
        'Unable to load your bookings. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void loadBookings();
    }, [loadBookings])
  );

  const getFilterCount = (filter: FilterType) => {
    if (filter === 'All') {
      return bookings.length;
    }

    const statuses = getFilterStatus(filter);

    return bookings.filter((booking) =>
      statuses.includes(booking.status)
    ).length;
  };

  const filteredBookings = bookings.filter((booking) => {
    if (selectedFilter === 'All') {
      return true;
    }

    const statuses = getFilterStatus(selectedFilter);

    return statuses.includes(booking.status);
  });

  // Accept or reject the current quotation
  const handleQuotationResponse = (
    booking: BookingItem,
    response: 'Accepted' | 'Rejected'
  ) => {
    if (respondingQuotationId) {
      return;
    }

    if (
      !booking.quotation ||
      booking.status !== 'Approved' ||
      booking.quotationStatus !== 'Sent'
    ) {
      showMessage(
        'Quotation Unavailable',
        'This quotation has already been processed or is no longer available.'
      );

      void loadBookings();
      return;
    }

    confirmAction({
      title:
        response === 'Accepted'
          ? 'Accept Quotation'
          : 'Reject Quotation',
      message:
        response === 'Accepted'
          ? `Are you sure you want to accept this quotation for ${formatAmount(booking.quotation.totalAmount)}?`
          : 'Are you sure you want to reject this quotation? The admin may send you a revised quotation.',
      confirmText: response === 'Accepted' ? 'Accept' : 'Reject',
      destructive: response === 'Rejected',
      onConfirm: async () => {
        try {
          setRespondingQuotationId(booking.id);

          await auth.authStateReady();

          const user = auth.currentUser;

          if (!user) {
            router.replace('/auth');
            return;
          }

          const latestBooking = bookings.find(
            (item) => item.id === booking.id
          );

          if (
            !latestBooking ||
            latestBooking.quotationStatus !== 'Sent'
          ) {
            showMessage(
              'Quotation Unavailable',
              'This quotation has already received a response.'
            );

            await loadBookings();
            return;
          }

          await updateUserBooking(user.uid, booking.id, {
            quotationStatus: response,
            quotationResponseAt: new Date().toISOString(),
          });

          await loadBookings();

          showMessage(
            response === 'Accepted'
              ? 'Quotation Accepted'
              : 'Quotation Rejected',
            response === 'Accepted'
              ? 'You have successfully accepted the quotation. The admin will be informed.'
              : 'You have rejected the quotation. The admin can now prepare a revised quotation.'
          );
        } catch (error) {
          console.log('Quotation response error:', error);

          showMessage(
            'Error',
            'Unable to submit your response. Please try again. If the problem continues, check your Firestore security rules.'
          );
        } finally {
          setRespondingQuotationId(null);
        }
      },
    });
  };

  const handleCancelBooking = (id: string) => {
    confirmAction({
      title: 'Cancel Booking',
      message: 'Are you sure you want to cancel this booking?',
      confirmText: 'Yes, Cancel',
      cancelText: 'No',
      destructive: true,
      onConfirm: async () => {
        try {
          await auth.authStateReady();

          const user = auth.currentUser;

          if (!user) {
            router.replace('/auth');
            return;
          }

          const booking = bookings.find((item) => item.id === id);

          if (
            !booking ||
            booking.status !== 'Waiting for Provider Response'
          ) {
            await loadBookings();

            showMessage(
              'Unable to Cancel',
              'This booking is no longer eligible for cancellation.'
            );

            return;
          }

          await updateUserBooking(user.uid, id, {
            status: 'Cancelled',
          });

          setExpandedBookingId(null);

          await loadBookings();

          showMessage(
            'Cancelled',
            'Your booking has been cancelled successfully.'
          );
        } catch (error) {
          console.log('Cancel booking error:', error);

          showMessage(
            'Error',
            'Unable to cancel your booking. Please try again.'
          );
        }
      },
    });
  };

  const handleConfirmCompletion = (id: string) => {
    confirmAction({
      title: 'Confirm Work Completed',
      message:
        'Have you checked the service and confirmed that the provider has finished the work?',
      confirmText: 'Yes, Confirm',
      cancelText: 'Not Yet',
      onConfirm: async () => {
        try {
          await auth.authStateReady();

          const user = auth.currentUser;

          if (!user) {
            router.replace('/auth');
            return;
          }

          const booking = bookings.find((item) => item.id === id);

          if (!booking || booking.status !== 'Approved') {
            await loadBookings();

            showMessage(
              'Unable to Confirm',
              'This booking is no longer available for completion confirmation.'
            );

            return;
          }

          await updateUserBooking(user.uid, id, {
            status: 'Completed',
            customerCompletedAt: new Date().toISOString(),
          });

          setExpandedBookingId(null);

          await loadBookings();

          showMessage(
            'Work Completed',
            'Your booking has been marked as completed. You can now rate and review the service.'
          );
        } catch (error) {
          console.log('Completion confirmation error:', error);

          showMessage(
            'Error',
            'Unable to confirm work completion. Please try again.'
          );
        }
      },
    });
  };

  // Generate the quotation PDF and save it to the phone / print on web
  const handleDownloadQuotationPdf = async (item: BookingItem) => {
    const quotation = item.quotation;

    if (!quotation || downloadingPdfId) {
      return;
    }

    try {
      setDownloadingPdfId(item.id);

      const fileName = `Quotation_${item.id}_v${quotation.version || 1}`
        .replace(/[^a-zA-Z0-9_-]/g, '_');

      // Web (Vercel): print ONLY the quotation HTML, not the whole page.
      // expo-print does not support printToFileAsync on web, and its
      // printAsync prints the current page, so we use a hidden iframe.
      if (Platform.OS === 'web') {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';

        document.body.appendChild(iframe);

        const frameWindow = iframe.contentWindow;
        const frameDoc = frameWindow?.document;

        if (!frameWindow || !frameDoc) {
          document.body.removeChild(iframe);
          window.alert('Unable to open the print preview.');
          return;
        }

        frameDoc.open();
        frameDoc.write(buildQuotationHtml(item, quotation, fileName));
        frameDoc.close();

        // Chrome uses the page title as the default PDF file name
        const previousTitle = document.title;
        document.title = fileName;

        setTimeout(() => {
          frameWindow.focus();
          frameWindow.print();

          setTimeout(() => {
            document.title = previousTitle;

            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 1000);
        }, 300);

        return;
      }

      // Ask expo-print for the PDF data (base64) directly, so we never
      // have to read its temporary file (that file is not readable on
      // some Android / Expo Go setups).
      const printResult = await Print.printToFileAsync({
        html: buildQuotationHtml(item, quotation, fileName),
        base64: true,
      });

      const base64 = printResult.base64;

      if (!base64) {
        throw new Error('PDF data was empty. Please try again.');
      }

      // Write our own copy of the PDF into the app cache folder
      const pdfUri = `${FileSystem.cacheDirectory}${fileName}.pdf`;

      await FileSystem.writeAsStringAsync(pdfUri, base64, {
        encoding: 'base64' as any,
      });

      const shareFile = async () => {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(pdfUri, {
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf',
            dialogTitle: 'Save Quotation PDF',
          });
        } else {
          Alert.alert(
            'Error',
            'Sharing is not available on this device.'
          );
        }
      };

      if (Platform.OS === 'android') {
        try {
          const permission =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

          if (!permission.granted) {
            return;
          }

          const fileUri =
            await FileSystem.StorageAccessFramework.createFileAsync(
              permission.directoryUri,
              fileName,
              'application/pdf'
            );

          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: 'base64' as any,
          });

          Alert.alert(
            'Downloaded',
            'Quotation PDF உங்க போனில் சேமிக்கப்பட்டது.'
          );
        } catch (safError) {
          // Folder save failed - fall back to the share sheet
          console.log('Folder save failed, using share sheet:', safError);
          await shareFile();
        }
      } else {
        // iOS: Save to Files / Share sheet
        await shareFile();
      }
    } catch (error: any) {
      console.log('PDF download error:', error);

      showMessage(
        'PDF Error',
        String(error?.message || error)
      );
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleWriteReview = (item: BookingItem) => {
    router.push({
      pathname: '/write-review',
      params: {
        bookingId: item.id,
        service: item.service,
      },
    });
  };

  // Customer quotation display
  const renderQuotation = (item: BookingItem) => {
    const quotation = item.quotation;

    if (!quotation) {
      return null;
    }

    const history = Array.isArray(item.quotationHistory)
      ? item.quotationHistory
      : [];

    const canRespond =
      item.status === 'Approved' &&
      item.quotationStatus === 'Sent';

    const isResponding =
      respondingQuotationId === item.id;

    const isDownloading =
      downloadingPdfId === item.id;

    return (
      <View style={styles.quotationSection}>
        <View style={styles.quotationDivider} />

        <View style={styles.quotationHeadingRow}>
          <Text style={styles.quotationHeading}>
            📋 Your Quotation
          </Text>

          <View
            style={[
              styles.quotationStatusBadge,
              item.quotationStatus === 'Accepted'
                ? styles.acceptedBadge
                : item.quotationStatus === 'Rejected'
                  ? styles.rejectedBadge
                  : styles.sentBadge,
            ]}
          >
            <Text
              style={[
                styles.quotationStatusText,
                item.quotationStatus === 'Accepted'
                  ? styles.acceptedText
                  : item.quotationStatus === 'Rejected'
                    ? styles.rejectedText
                    : styles.sentText,
              ]}
            >
              {item.quotationStatus || 'Sent'}
            </Text>
          </View>
        </View>

        <View style={styles.quotationCard}>
          <Text style={styles.quotationVersion}>
            Quotation #{quotation.version || 1}
          </Text>

          <Text style={styles.quotationLabel}>
            Work Description
          </Text>

          <Text style={styles.quotationValue}>
            {quotation.workDescription || 'Not provided'}
          </Text>

          <View style={styles.quotationDividerSmall} />

          <Text style={styles.quotationLabel}>
            Work Items & Charges
          </Text>

          {Array.isArray(quotation.items) &&
          quotation.items.length > 0 ? (
            quotation.items.map((quoteItem, index) => (
              <View
                key={`${item.id}_quote_${quotation.version}_${index}`}
                style={styles.quotationItemRow}
              >
                <Text style={styles.quotationItemDescription}>
                  {quoteItem.description}
                </Text>

                <Text style={styles.quotationItemAmount}>
                  {formatAmount(quoteItem.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.quotationValue}>
              No quotation items available.
            </Text>
          )}

          <View style={styles.quotationTotalRow}>
            <Text style={styles.quotationTotalLabel}>
              Total Amount
            </Text>

            <Text style={styles.quotationTotalAmount}>
              {formatAmount(quotation.totalAmount)}
            </Text>
          </View>

          <View style={styles.quotationDividerSmall} />

          <Text style={styles.quotationLabel}>
            Estimated Completion Time
          </Text>

          <Text style={styles.quotationValue}>
            {quotation.estimatedDuration || 'Not provided'}
          </Text>

          <Text style={styles.quotationLabel}>
            Warranty
          </Text>

          <Text style={styles.quotationValue}>
            {quotation.warranty || 'Not specified'}
          </Text>

          {quotation.createdAt ? (
            <>
              <Text style={styles.quotationLabel}>
                Quotation Date
              </Text>

              <Text style={styles.quotationValue}>
                {new Date(
                  quotation.createdAt
                ).toLocaleString()}
              </Text>
            </>
          ) : null}

          {item.quotationResponseAt ? (
            <>
              <Text style={styles.quotationLabel}>
                Your Response Date
              </Text>

              <Text style={styles.quotationValue}>
                {new Date(
                  item.quotationResponseAt
                ).toLocaleString()}
              </Text>
            </>
          ) : null}
        </View>

        {/* Download quotation as PDF */}
        <AnimatedButton
          style={[
            styles.downloadPdfButton,
            isDownloading && styles.disabledQuotationButton,
          ]}
          onPress={() => handleDownloadQuotationPdf(item)}
        >
          {isDownloading ? (
            <ActivityIndicator color="#B85D32" />
          ) : (
            <Text style={styles.downloadPdfText}>
              📄 Download PDF
            </Text>
          )}
        </AnimatedButton>

        {canRespond && (
          <View style={styles.quotationActionContainer}>
            <Text style={styles.quotationInstruction}>
              Please review the quotation and choose your response.
            </Text>

            <AnimatedButton
              style={[
                styles.acceptQuotationButton,
                isResponding && styles.disabledQuotationButton,
              ]}
              onPress={() =>
                handleQuotationResponse(item, 'Accepted')
              }
            >
              {isResponding ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.acceptQuotationText}>
                  ✓ Accept Quotation
                </Text>
              )}
            </AnimatedButton>

            <AnimatedButton
              style={[
                styles.rejectQuotationButton,
                isResponding && styles.disabledQuotationButton,
              ]}
              onPress={() =>
                handleQuotationResponse(item, 'Rejected')
              }
            >
              <Text style={styles.rejectQuotationText}>
                ✕ Reject Quotation
              </Text>
            </AnimatedButton>
          </View>
        )}

        {item.quotationStatus === 'Accepted' && (
          <View style={styles.quotationAcceptedMessage}>
            <Text style={styles.quotationAcceptedMessageText}>
              ✓ You accepted this quotation.
            </Text>
          </View>
        )}

        {item.quotationStatus === 'Rejected' && (
          <View style={styles.quotationRejectedMessage}>
            <Text style={styles.quotationRejectedMessageText}>
              You rejected this quotation. You can wait for the admin to send a revised quotation.
            </Text>
          </View>
        )}

        {item.quotationStatus === 'Sent' && !canRespond && (
          <View style={styles.quotationWaitingMessage}>
            <Text style={styles.quotationWaitingText}>
              Waiting for the booking to be approved before you can respond.
            </Text>
          </View>
        )}

        {history.length > 0 && (
          <View style={styles.quotationHistoryContainer}>
            <Text style={styles.quotationHistoryHeading}>
              Previous Quotations
            </Text>

            {history.map((oldQuote, index) => (
              <View
                key={`${item.id}_old_quote_${index}`}
                style={styles.quotationHistoryCard}
              >
                <View style={styles.quotationHistoryTop}>
                  <Text style={styles.quotationHistoryVersion}>
                    Quotation #{oldQuote.version || index + 1}
                  </Text>

                  <Text style={styles.quotationHistoryAmount}>
                    {formatAmount(oldQuote.totalAmount)}
                  </Text>
                </View>

                <Text style={styles.quotationHistoryDescription}>
                  {oldQuote.workDescription || 'No description'}
                </Text>

                {oldQuote.createdAt ? (
                  <Text style={styles.quotationHistoryDate}>
                    {new Date(
                      oldQuote.createdAt
                    ).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderBooking = ({
    item,
    index,
  }: {
    item: BookingItem;
    index: number;
  }) => {
    const isExpanded = expandedBookingId === item.id;

    const canEdit =
      item.status === 'Waiting for Provider Response';

    const canConfirmCompletion =
      item.status === 'Approved';

    const extraDetails = Object.entries(
      item as Record<string, unknown>
    ).filter(([key, value]) => {
      return (
        !hiddenFields.includes(key) &&
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
      );
    });

    const locationParts = [
      item.area,
      item.city,
      item.district,
    ].filter(Boolean);

    const uniqueLocation = locationParts.filter(
      (value, index, values) =>
        values.findIndex(
          (v) => v.toLowerCase() === value.toLowerCase()
        ) === index
    );

    return (
      <AnimatedCard
        key={item.id}
        style={styles.card}
        delay={Math.min(index * 70, 350)}
      >
        <View>
          <Text style={styles.service}>
            {item.service}
          </Text>

          <Text style={styles.label}>Booking ID</Text>
          <Text style={styles.value}>{item.id}</Text>

          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>
            {uniqueLocation.join(', ')}
          </Text>

          <Text style={styles.label}>Preferred Date</Text>
          <Text style={styles.value}>
            {item.preferredDate}
          </Text>

          <Text style={styles.label}>Preferred Time</Text>
          <Text style={styles.value}>
            {item.preferredTime}
          </Text>

          <View style={styles.statusBox}>
            <Text style={styles.status}>
              {item.status}
            </Text>
          </View>

          {canEdit && (
            <>
              <AnimatedButton
                style={styles.editButton}
                onPress={() =>
                  router.push({
                    pathname: '/edit-booking',
                    params: { id: item.id },
                  })
                }
              >
                <Text style={styles.editButtonText}>
                  Edit Booking
                </Text>
              </AnimatedButton>

              <AnimatedButton
                style={styles.cancelButton}
                onPress={() => handleCancelBooking(item.id)}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel Booking
                </Text>
              </AnimatedButton>
            </>
          )}

          {canConfirmCompletion && (
            <AnimatedButton
              style={styles.completeButton}
              onPress={() => handleConfirmCompletion(item.id)}
            >
              <Text style={styles.completeButtonText}>
                ✓ Confirm Work Completed
              </Text>
            </AnimatedButton>
          )}

          {item.status === 'Completed' && (
            <>
              <View style={styles.completedMessage}>
                <Text style={styles.completedText}>
                  ✓ Work completed successfully
                </Text>
              </View>

              {item.hasReview ? (
                <View style={styles.reviewSubmitted}>
                  <Text style={styles.reviewSubmittedText}>
                    ⭐ Thank you! Review submitted
                  </Text>
                </View>
              ) : (
                <AnimatedButton
                  style={styles.reviewButton}
                  onPress={() => handleWriteReview(item)}
                >
                  <Text style={styles.reviewButtonText}>
                    ⭐ Rate & Review
                  </Text>
                </AnimatedButton>
              )}
            </>
          )}

          {/* Customer quotation */}
          {renderQuotation(item)}

          <AnimatedButton
            style={styles.detailsButton}
            onPress={() =>
              setExpandedBookingId(
                isExpanded ? null : item.id
              )
            }
          >
            <Text style={styles.detailsButtonText}>
              {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
            </Text>
          </AnimatedButton>

          {isExpanded && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsHeading}>
                Complete Booking Details
              </Text>

              {extraDetails.length > 0 ? (
                extraDetails.map(([key, value]) => (
                  <View key={key} style={styles.detailItem}>
                    <Text style={styles.detailLabel}>
                      {formatLabel(key)}
                    </Text>

                    <Text style={styles.detailValue}>
                      {String(value)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  No additional details available.
                </Text>
              )}
            </View>
          )}
        </View>
      </AnimatedCard>
    );
  };

  if (loading) {
    return <BookingLoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <AnimatedCard style={styles.headerCard}>
        <Text style={styles.heading}>My Bookings</Text>

        <Text style={styles.subtitle}>
          Track your home service requests
        </Text>
      </AnimatedCard>

      {/* Booking status filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
        bounces={false}
        alwaysBounceHorizontal={false}
        overScrollMode="never"
      >
        {filters.map((filter) => {
          const isSelected = selectedFilter === filter;

          return (
            <Pressable
              key={filter}
              onPress={() => {
                setSelectedFilter(filter);
                setExpandedBookingId(null);
              }}
              style={[
                styles.filterButton,
                isSelected && styles.activeFilterButton,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.filterText,
                  isSelected && styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>

              <View
                style={[
                  styles.filterCount,
                  isSelected && styles.activeFilterCount,
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,
                    isSelected && styles.activeFilterCountText,
                  ]}
                >
                  {getFilterCount(filter)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <AnimatedCard style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🏡</Text>

            <Text style={styles.emptyTitle}>
              {selectedFilter === 'All'
                ? 'No bookings yet'
                : `No ${selectedFilter.toLowerCase()} bookings`}
            </Text>

            <Text style={styles.emptyText}>
              {selectedFilter === 'All'
                ? 'Your submitted service requests will appear here.'
                : 'Bookings with this status will appear here.'}
            </Text>
          </AnimatedCard>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1E5',
    padding: 20,
    paddingTop: 55,
  },

  headerCard: {
    marginBottom: 15,
  },

  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#392D28',
  },

  subtitle: {
    fontSize: 14,
    color: '#8C756A',
    marginTop: 6,
  },

  filterScroll: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
    height: 58,
    marginBottom: 15,
  },

  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 6,
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    minHeight: 42,
    paddingVertical: 10,
    paddingHorizontal: 13,
    marginRight: 8,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  activeFilterButton: {
    backgroundColor: '#B85D32',
    borderColor: '#B85D32',
  },

  filterText: {
    color: '#765C50',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 0,
  },

  activeFilterText: {
    color: '#FFFFFF',
  },

  filterCount: {
    backgroundColor: '#FFF1E5',
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 7,
    flexShrink: 0,
  },

  activeFilterCount: {
    backgroundColor: '#FFFFFF',
  },

  filterCountText: {
    color: '#8C756A',
    fontSize: 11,
    fontWeight: 'bold',
  },

  activeFilterCountText: {
    color: '#B85D32',
  },

  list: {
    paddingBottom: 25,
    flexGrow: 1,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  service: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#B85D32',
    marginBottom: 14,
  },

  label: {
    fontSize: 12,
    color: '#8C756A',
    marginTop: 9,
  },

  value: {
    fontSize: 15,
    color: '#392D28',
    marginTop: 3,
  },

  statusBox: {
    backgroundColor: '#FFF1E5',
    padding: 12,
    borderRadius: 9,
    marginTop: 16,
  },

  status: {
    color: '#B85D32',
    fontWeight: 'bold',
    fontSize: 13,
  },

  editButton: {
    marginTop: 15,
    padding: 12,
    borderRadius: 9,
    backgroundColor: '#E9A66F',
    alignItems: 'center',
  },

  editButtonText: {
    color: '#392D28',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },

  cancelButton: {
    marginTop: 10,
    padding: 12,
    borderRadius: 9,
    backgroundColor: '#FCE5DC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D98B70',
  },

  cancelButtonText: {
    color: '#A33E27',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },

  completeButton: {
    marginTop: 15,
    padding: 13,
    borderRadius: 9,
    backgroundColor: '#477B55',
    alignItems: 'center',
  },

  completeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },

  completedMessage: {
    marginTop: 15,
    padding: 12,
    borderRadius: 9,
    backgroundColor: '#E6F3E8',
    borderWidth: 1,
    borderColor: '#A8CDAE',
  },

  completedText: {
    color: '#356B42',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },

  reviewButton: {
    marginTop: 10,
    padding: 13,
    borderRadius: 9,
    backgroundColor: '#B85D32',
    alignItems: 'center',
  },

  reviewButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },

  reviewSubmitted: {
    marginTop: 10,
    padding: 12,
    borderRadius: 9,
    backgroundColor: '#FFF5D9',
    borderWidth: 1,
    borderColor: '#E8D39A',
  },

  reviewSubmittedText: {
    color: '#8A641B',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },

  detailsButton: {
    marginTop: 10,
    padding: 12,
    borderRadius: 9,
    backgroundColor: '#B85D32',
    alignItems: 'center',
  },

  detailsButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },

  detailsContainer: {
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EAD8C9',
  },

  detailsHeading: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#392D28',
    marginBottom: 8,
  },

  detailItem: {
    marginBottom: 12,
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DF',
  },

  detailLabel: {
    fontSize: 12,
    color: '#8C756A',
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 15,
    color: '#392D28',
    lineHeight: 21,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 15,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#392D28',
  },

  emptyText: {
    fontSize: 14,
    color: '#8C756A',
    textAlign: 'center',
    marginTop: 8,
  },

  // Quotation styles

  quotationSection: {
    marginTop: 16,
  },

  quotationDivider: {
    height: 1,
    backgroundColor: '#EAD8C9',
    marginBottom: 16,
  },

  quotationHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  quotationHeading: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#B85D32',
    flex: 1,
  },

  quotationStatusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 20,
  },

  acceptedBadge: {
    backgroundColor: '#DDF0E1',
  },

  rejectedBadge: {
    backgroundColor: '#F8DFD9',
  },

  sentBadge: {
    backgroundColor: '#FCE5DC',
  },

  quotationStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  acceptedText: {
    color: '#347348',
  },

  rejectedText: {
    color: '#A33E27',
  },

  sentText: {
    color: '#B85D32',
  },

  quotationCard: {
    backgroundColor: '#FFF8F2',
    borderRadius: 13,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  quotationVersion: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#392D28',
    marginBottom: 12,
  },

  quotationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8C756A',
    marginTop: 13,
    marginBottom: 5,
  },

  quotationValue: {
    fontSize: 14,
    color: '#392D28',
    lineHeight: 21,
  },

  quotationDividerSmall: {
    height: 1,
    backgroundColor: '#EAD8C9',
    marginTop: 14,
  },

  quotationItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E3D9',
  },

  quotationItemDescription: {
    flex: 1,
    fontSize: 13,
    color: '#392D28',
    lineHeight: 19,
  },

  quotationItemAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#392D28',
  },

  quotationTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },

  quotationTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#392D28',
  },

  quotationTotalAmount: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#B85D32',
  },

  // Download PDF button

  downloadPdfButton: {
    marginTop: 12,
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B85D32',
  },

  downloadPdfText: {
    color: '#B85D32',
    fontSize: 14,
    fontWeight: 'bold',
  },

  quotationActionContainer: {
    marginTop: 14,
  },

  quotationInstruction: {
    fontSize: 12,
    color: '#8C756A',
    lineHeight: 19,
    marginBottom: 10,
  },

  acceptQuotationButton: {
    backgroundColor: '#477B55',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  acceptQuotationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  rejectQuotationButton: {
    backgroundColor: '#FCE5DC',
    borderWidth: 1,
    borderColor: '#D98B70',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },

  rejectQuotationText: {
    color: '#A33E27',
    fontSize: 14,
    fontWeight: 'bold',
  },

  disabledQuotationButton: {
    opacity: 0.6,
  },

  quotationAcceptedMessage: {
    backgroundColor: '#E6F3E8',
    borderWidth: 1,
    borderColor: '#A8CDAE',
    borderRadius: 10,
    padding: 13,
    marginTop: 13,
  },

  quotationAcceptedMessageText: {
    color: '#356B42',
    fontSize: 13,
    fontWeight: 'bold',
  },

  quotationRejectedMessage: {
    backgroundColor: '#FCE5DC',
    borderWidth: 1,
    borderColor: '#D98B70',
    borderRadius: 10,
    padding: 13,
    marginTop: 13,
  },

  quotationRejectedMessageText: {
    color: '#A33E27',
    fontSize: 12,
    lineHeight: 19,
  },

  quotationWaitingMessage: {
    backgroundColor: '#FFF5D9',
    borderRadius: 10,
    padding: 12,
    marginTop: 13,
  },

  quotationWaitingText: {
    color: '#8A641B',
    fontSize: 12,
    lineHeight: 18,
  },

  quotationHistoryContainer: {
    marginTop: 17,
  },

  quotationHistoryHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#392D28',
    marginBottom: 10,
  },

  quotationHistoryCard: {
    backgroundColor: '#F8F0EA',
    padding: 13,
    borderRadius: 10,
    marginBottom: 9,
  },

  quotationHistoryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  quotationHistoryVersion: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#392D28',
  },

  quotationHistoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B85D32',
  },

  quotationHistoryDescription: {
    fontSize: 12,
    color: '#8C756A',
    marginTop: 7,
    lineHeight: 18,
  },

  quotationHistoryDate: {
    fontSize: 11,
    color: '#A99589',
    marginTop: 6,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF1E5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },

  loadingIconCircle: {
    width: 115,
    height: 115,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EAD8C9',
    marginBottom: 22,
  },

  loadingHouse: {
    fontSize: 58,
  },

  loadingBrand: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#B85D32',
    letterSpacing: 1,
  },

  loadingTagline: {
    fontSize: 15,
    color: '#8C756A',
    marginTop: 7,
  },

  loadingSpinner: {
    marginTop: 35,
    marginBottom: 15,
  },

  loadingMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#392D28',
  },

  loadingSubtext: {
    fontSize: 13,
    color: '#8C756A',
    marginTop: 7,
  },
});