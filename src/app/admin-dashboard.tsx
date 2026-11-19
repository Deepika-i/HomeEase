import { useCallback, useEffect, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';

import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';

import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import * as Print from 'expo-print';

import { createUserNotification } from '../utils/firestoreBookingStorage';

const ADMIN_UID = 'XORlsuEUPYfsmlFqgXCSaoY1jvz1';

type BookingFilter =
  | 'All'
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Completed'
  | 'Cancelled';

const BOOKING_FILTERS: BookingFilter[] = [
  'All',
  'Pending',
  'Approved',
  'Rejected',
  'Completed',
  'Cancelled',
];

type QuotationItem = {
  id: string;
  description: string;
  amount: string;
};

type SavedQuotationItem = {
  description: string;
  amount: string | number;
};

type QuotationData = {
  version?: number;
  items?: SavedQuotationItem[];
  totalAmount?: number;
  workDescription?: string;
  estimatedDuration?: string;
  warranty?: string;
  createdAt?: string;
};

type CustomerConversation = {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: number;
};

type AdminBooking = {
  id: string;
  userId: string;
  service: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  city: string;
  area: string;
  address: string;
  landmark?: string;
  preferredDate: string;
  preferredTime: string;
  additionalRequirements?: string;
  status: string;
  quotation?: QuotationData;
  quotationHistory?: QuotationData[];
  quotationStatus?: string;
  quotationResponseAt?: string | null;
  createdAt?: any;
  [key: string]: any;
};

export default function AdminDashboardScreen() {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  const [customers, setCustomers] = useState<CustomerConversation[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCustomerId, setSelectedCustomerId] =
    useState<string | null>(null);

  const [selectedBookingId, setSelectedBookingId] =
    useState<string | null>(null);

  const [bookingFilter, setBookingFilter] =
    useState<BookingFilter>('All');

  const [quotationModalVisible, setQuotationModalVisible] =
    useState(false);

  const [quotationBooking, setQuotationBooking] =
    useState<AdminBooking | null>(null);

  const [quotationItems, setQuotationItems] =
    useState<QuotationItem[]>([
      { id: '1', description: '', amount: '' },
    ]);

  const [workDescription, setWorkDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [warranty, setWarranty] = useState('');

  useEffect(() => {
    if (!loading) {
      fadeAnim.setValue(0);
      slideAnim.setValue(15);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, fadeAnim, slideAnim]);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const getBookingTime = (value: any): number => {
    if (typeof value === 'string') {
      return Date.parse(value) || 0;
    }

    if (typeof value?.toMillis === 'function') {
      return value.toMillis();
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    return 0;
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      await auth.authStateReady();

      const currentUser = auth.currentUser;

      if (!currentUser || currentUser.uid !== ADMIN_UID) {
        router.replace('/admin-login');
        return;
      }

      const usersSnapshot = await getDocs(collection(db, 'users'));

      const customerDocs = usersSnapshot.docs.filter(
        (userDoc) => userDoc.id !== ADMIN_UID
      );

      const profileMap = new Map<string, Record<string, any>>();

      customerDocs.forEach((userDoc) => {
        profileMap.set(userDoc.id, userDoc.data());
      });

      const customerData: CustomerConversation[] =
        await Promise.all(
          customerDocs.map(async (userDoc) => {
            const profile = userDoc.data();

            const messagesRef = collection(
              db,
              'users',
              userDoc.id,
              'supportMessages'
            );

            const latestMessageQuery = query(
              messagesRef,
              orderBy('createdAt', 'desc'),
              limit(1)
            );

            const messageSnapshot = await getDocs(latestMessageQuery);
            const latestMessage = messageSnapshot.docs[0]?.data();

            return {
              id: userDoc.id,
              name: profile.name || 'HomeEase Customer',
              email: profile.email || '',
              phone: profile.phone || '',
              lastMessage: latestMessage?.text || 'No messages yet',
              lastMessageTime: getBookingTime(latestMessage?.createdAt),
            };
          })
        );

      customerData.sort(
        (a, b) => b.lastMessageTime - a.lastMessageTime
      );

      setCustomers(customerData);

      const bookingSnapshot = await getDocs(
        collectionGroup(db, 'bookings')
      );

      const allBookings: AdminBooking[] = bookingSnapshot.docs
        .map((bookingDoc) => {
          const data = bookingDoc.data();

          const userId =
            bookingDoc.ref.parent.parent?.id ||
            data.userId ||
            '';

          const profile = profileMap.get(userId) || {};

          const bookingName =
            typeof data.name === 'string' ? data.name.trim() : '';

          const profileName =
            typeof profile.name === 'string'
              ? profile.name.trim()
              : '';

          return {
            ...data,
            id: bookingDoc.id,
            userId,
            name:
              bookingName || profileName || 'HomeEase Customer',
            email: profile.email || data.email || '',
            phone: profile.phone || data.phone || '',
            service: data.service || 'Home Service',
            district: data.district || '',
            city: data.city || '',
            area: data.area || '',
            address: data.address || '',
            preferredDate: data.preferredDate || '',
            preferredTime: data.preferredTime || '',
            status: data.status || 'Waiting for Provider Response',
          };
        })
        .filter((booking) => booking.userId !== ADMIN_UID);

      allBookings.sort(
        (a, b) =>
          getBookingTime(b.createdAt) -
          getBookingTime(a.createdAt)
      );

      setBookings(allBookings);
    } catch (error) {
      console.log('Admin dashboard error:', error);

      showMessage(
        'Error',
        'Unable to load customer and booking information. Please check Firestore permissions.'
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard])
  );

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to logout?'
      );

      if (confirmed) {
        void logoutAdmin();
      }

      return;
    }

    Alert.alert(
      'Admin Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            void logoutAdmin();
          },
        },
      ]
    );
  };

  const logoutAdmin = async () => {
    try {
      await signOut(auth);
      router.replace('/admin-login');
    } catch {
      showMessage('Error', 'Unable to logout. Please try again.');
    }
  };

  const openConversation = (customer: CustomerConversation) => {
    router.push({
      pathname: '/admin-chat' as any,
      params: {
        userId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
      },
    } as any);
  };

  const toggleCustomerDetails = (customerId: string) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut
    );

    setSelectedCustomerId((previous) =>
      previous === customerId ? null : customerId
    );
  };

  const toggleBookingDetails = (booking: AdminBooking) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut
    );

    const bookingKey = `${booking.userId}_${booking.id}`;

    setSelectedBookingId((previous) =>
      previous === bookingKey ? null : bookingKey
    );
  };

  // Actual Firebase status update
  const updateBookingStatus = async (
    booking: AdminBooking,
    newStatus: string
  ) => {
    try {
      if (
        !auth.currentUser ||
        auth.currentUser.uid !== ADMIN_UID
      ) {
        showMessage('Error', 'Admin login required.');
        return;
      }

      const bookingRef = doc(
        db,
        'users',
        booking.userId,
        'bookings',
        booking.id
      );

      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // Notification is separate so a notification failure
      // does not undo the successful booking status update.
      try {
        await createUserNotification(booking.userId, {
          title: 'Booking Status Updated',
          message: `Your ${booking.service || 'service'} booking status has been updated to ${newStatus}.`,
          type:
            newStatus === 'Approved'
              ? 'approved'
              : newStatus === 'Rejected'
                ? 'rejected'
                : newStatus === 'Cancelled'
                  ? 'cancelled'
                  : 'general',
          bookingId: booking.id,
        });
      } catch (notificationError) {
        console.error(
          'Booking notification error:',
          notificationError
        );
      }

      showMessage(
        'Success',
        `Booking status changed to ${newStatus}.`
      );

      await loadDashboard();
    } catch (error) {
      console.error('Status update error:', error);

      showMessage(
        'Error',
        'Unable to update booking status. Please check your Firebase permissions.'
      );
    }
  };

  // Web and native confirmation
  const changeBookingStatus = (
    booking: AdminBooking,
    newStatus: string
  ) => {
    const message =
      `Are you sure you want to change this booking status to "${newStatus}"?`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);

      if (!confirmed) {
        return;
      }

      void updateBookingStatus(booking, newStatus);
      return;
    }

    Alert.alert(
      'Confirm Status Change',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            void updateBookingStatus(booking, newStatus);
          },
        },
      ]
    );
  };

  const canSendQuotation = (booking: AdminBooking) =>
    booking.status === 'Approved' &&
    (!booking.quotation || booking.quotationStatus === 'Rejected');

  const openQuotationForm = (booking: AdminBooking) => {
    setQuotationBooking(booking);

    if (
      booking.quotation &&
      booking.quotationStatus === 'Rejected'
    ) {
      setQuotationItems(
        booking.quotation.items?.length
          ? booking.quotation.items.map((item, index) => ({
              id: `${Date.now()}-${index}`,
              description: item.description || '',
              amount: String(item.amount ?? ''),
            }))
          : [{ id: String(Date.now()), description: '', amount: '' }]
      );

      setWorkDescription(booking.quotation.workDescription || '');
      setEstimatedDuration(booking.quotation.estimatedDuration || '');
      setWarranty(booking.quotation.warranty || '');
    } else {
      setQuotationItems([
        { id: String(Date.now()), description: '', amount: '' },
      ]);

      setWorkDescription('');
      setEstimatedDuration('');
      setWarranty('');
    }

    setQuotationModalVisible(true);
  };

  const addQuotationItem = () => {
    setQuotationItems((previous) => [
      ...previous,
      {
        id: `${Date.now()}-${previous.length}`,
        description: '',
        amount: '',
      },
    ]);
  };

  const updateQuotationItem = (
    index: number,
    field: 'description' | 'amount',
    value: string
  ) => {
    setQuotationItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeQuotationItem = (index: number) => {
    setQuotationItems((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const quotationTotal = quotationItems.reduce(
    (total, item) => total + (Number(item.amount) || 0),
    0
  );

  const sendQuotation = async () => {
    if (!quotationBooking) {
      showMessage('Error', 'No booking selected.');
      return;
    }

    const validItems = quotationItems
      .map((item) => ({
        description: item.description.trim(),
        amount: Number(item.amount),
      }))
      .filter(
        (item) =>
          item.description.length > 0 &&
          Number.isFinite(item.amount) &&
          item.amount > 0
      );

    if (validItems.length === 0) {
      showMessage(
        'Missing Details',
        'Please add at least one quotation item with a valid amount.'
      );
      return;
    }

    if (!workDescription.trim()) {
      showMessage(
        'Missing Details',
        'Please enter the work description.'
      );
      return;
    }

    if (!estimatedDuration.trim()) {
      showMessage(
        'Missing Details',
        'Please enter the estimated duration.'
      );
      return;
    }

    const booking = quotationBooking;

    const submitQuotation = async () => {
      try {
        if (
          !auth.currentUser ||
          auth.currentUser.uid !== ADMIN_UID
        ) {
          showMessage('Error', 'Admin login required.');
          return;
        }

        const now = new Date().toISOString();

        const newQuotation: QuotationData = {
          version: (booking.quotation?.version || 0) + 1,
          items: validItems,
          totalAmount: validItems.reduce(
            (total, item) => total + item.amount,
            0
          ),
          workDescription: workDescription.trim(),
          estimatedDuration: estimatedDuration.trim(),
          warranty: warranty.trim(),
          createdAt: now,
        };

        const previousHistory = booking.quotationHistory || [];

        const updatedHistory = booking.quotation
          ? [...previousHistory, booking.quotation]
          : previousHistory;

        const bookingRef = doc(
          db,
          'users',
          booking.userId,
          'bookings',
          booking.id
        );

        await updateDoc(bookingRef, {
          quotation: newQuotation,
          quotationHistory: updatedHistory,
          quotationStatus: 'Sent',
          quotationResponseAt: null,
          updatedAt: now,
        });

        try {
          await createUserNotification(booking.userId, {
            title: 'Quotation Received',
            message: `Your quotation for ${booking.service || 'your service'} is ready. Total amount: ₹${newQuotation.totalAmount?.toLocaleString('en-IN')}.`,
            type: 'quotation',
            bookingId: booking.id,
          });
        } catch (notificationError) {
          console.error(
            'Quotation notification error:',
            notificationError
          );
        }

        setQuotationModalVisible(false);
        setQuotationBooking(null);

        showMessage('Success', 'Quotation sent successfully.');

        await loadDashboard();
      } catch (error) {
        console.error('Send quotation error:', error);

        showMessage(
          'Error',
          'Unable to send quotation. Please try again.'
        );
      }
    };

    const confirmationMessage =
      `Send quotation for ₹${quotationTotal.toLocaleString('en-IN')}?`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmationMessage);

      if (confirmed) {
        await submitQuotation();
      }

      return;
    }

    Alert.alert(
      'Send Quotation',
      confirmationMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            void submitQuotation();
          },
        },
      ]
    );
  };

  const renderCustomer = (customer: CustomerConversation) => {
    const isExpanded = selectedCustomerId === customer.id;

    const bookingCount = bookings.filter(
      (booking) => booking.userId === customer.id
    ).length;

    return (
      <View key={customer.id} style={styles.customerCard}>
        <Pressable
          style={styles.customerHeader}
          onPress={() => toggleCustomerDetails(customer.id)}
        >
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              {customer.name || 'Customer'}
            </Text>

            <Text style={styles.customerEmail}>
              {customer.email || 'No email'}
            </Text>

            <Text style={styles.customerPhone}>
              {customer.phone || 'No phone number'}
            </Text>
          </View>

          <View style={styles.customerRight}>
            <Text style={styles.bookingCount}>
              {bookingCount} bookings
            </Text>

            <Text style={styles.expandIcon}>
              {isExpanded ? '−' : '+'}
            </Text>
          </View>
        </Pressable>

        {isExpanded && (
          <View style={styles.customerExpanded}>
            <Text style={styles.sectionSubtitle}>
              Customer Details
            </Text>

            <Text style={styles.detailText}>
              Name: {customer.name || '-'}
            </Text>

            <Text style={styles.detailText}>
              Email: {customer.email || '-'}
            </Text>

            <Text style={styles.detailText}>
              Phone: {customer.phone || '-'}
            </Text>

            <Text style={styles.detailText}>
              Total Bookings: {bookingCount}
            </Text>

            <Text style={styles.detailText}>
              Latest Message: {customer.lastMessage}
            </Text>

            <Pressable
              style={styles.chatButton}
              onPress={() => openConversation(customer)}
            >
              <Text style={styles.actionButtonText}>
                Open Customer Chat
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const renderBookingCustomer = (booking: AdminBooking) => {
    const customer = customers.find(
      (item) => item.id === booking.userId
    );

    return (
      <View style={styles.customerMiniCard}>
        <Text style={styles.customerMiniName}>
          {customer?.name || booking.name || 'Customer'}
        </Text>

        <Text style={styles.customerMiniText}>
          {customer?.email || booking.email || 'No email'}
        </Text>

        <Text style={styles.customerMiniText}>
          {customer?.phone || booking.phone || 'No phone number'}
        </Text>
      </View>
    );
  };

  const handleDownloadQuotation = async (booking: AdminBooking) => {
    if (!booking.quotation) {
      showMessage(
        'Quotation Not Found',
        'This booking does not have a quotation.'
      );
      return;
    }

    try {
      const quotation = booking.quotation;

      const safeBookingId = booking.id.replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      );

      const filename =
        `HomeEase_Quotation_${safeBookingId}_V${quotation.version || 1}.pdf`;

      const escapeHtml = (value: any) =>
        String(value ?? '-').replace(/[&<>"']/g, (character) => {
          const entities: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          };

          return entities[character];
        });

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>${escapeHtml(filename.replace(/\.pdf$/i, ''))}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 30px;
                color: #392D28;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #B85D32;
                padding-bottom: 18px;
                margin-bottom: 24px;
              }
              .brand {
                font-size: 28px;
                font-weight: bold;
                color: #B85D32;
              }
              .subtitle {
                font-size: 13px;
                color: #8C756A;
                margin-top: 5px;
              }
              h2 {
                color: #B85D32;
                font-size: 19px;
              }
              .section {
                margin-bottom: 20px;
              }
              .row {
                margin-bottom: 9px;
                font-size: 13px;
              }
              .label {
                font-weight: bold;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 12px;
              }
              th {
                background: #B85D32;
                color: white;
                padding: 11px;
                text-align: left;
                font-size: 13px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              td {
                border: 1px solid #E8D8CC;
                padding: 10px;
                font-size: 13px;
              }
              .total {
                text-align: right;
                font-size: 19px;
                font-weight: bold;
                color: #B85D32;
                margin-top: 18px;
              }
              .footer {
                border-top: 1px solid #E8D8CC;
                margin-top: 35px;
                padding-top: 15px;
                color: #8C756A;
                font-size: 11px;
                text-align: center;
              }
            </style>
          </head>

          <body>
            <div class="header">
              <div class="brand">HomeEase</div>
              <div class="subtitle">Home Services Made Easy</div>
              <h2>Service Quotation</h2>
              <div class="subtitle">
                Quotation Version ${quotation.version || 1}
              </div>
            </div>

            <div class="section">
              <h2>Customer Details</h2>

              <div class="row">
                <span class="label">Customer:</span>
                ${escapeHtml(booking.name)}
              </div>

              <div class="row">
                <span class="label">Booking ID:</span>
                ${escapeHtml(booking.id)}
              </div>

              <div class="row">
                <span class="label">Service:</span>
                ${escapeHtml(booking.service)}
              </div>

              <div class="row">
                <span class="label">Location:</span>
                ${escapeHtml([
                  booking.area,
                  booking.city,
                  booking.district,
                ].filter(Boolean).join(', ') || '-')}
              </div>

              <div class="row">
                <span class="label">Date:</span>
                ${escapeHtml(booking.preferredDate)}
              </div>

              <div class="row">
                <span class="label">Time:</span>
                ${escapeHtml(booking.preferredTime)}
              </div>
            </div>

            <div class="section">
              <h2>Quotation Items</h2>

              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Amount (INR)</th>
                  </tr>
                </thead>

                <tbody>
                  ${(quotation.items || []).map((item) => `
                    <tr>
                      <td>${escapeHtml(item.description)}</td>
                      <td>₹${Number(item.amount).toLocaleString('en-IN')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="total">
                Total: ₹${Number(
                  quotation.totalAmount || 0
                ).toLocaleString('en-IN')}
              </div>
            </div>

            <div class="section">
              <h2>Work Details</h2>

              <div class="row">
                <span class="label">Description:</span>
                ${escapeHtml(quotation.workDescription)}
              </div>

              <div class="row">
                <span class="label">Estimated Duration:</span>
                ${escapeHtml(quotation.estimatedDuration)}
              </div>

              <div class="row">
                <span class="label">Warranty:</span>
                ${escapeHtml(quotation.warranty || 'Not specified')}
              </div>
            </div>

            <div class="footer">
              Thank you for choosing HomeEase.
              <br />
              This quotation is subject to inspection and customer approval.
            </div>
          </body>
        </html>
      `;

      // Web (Vercel): print ONLY the quotation HTML, not the dashboard page.
      // expo-print's printAsync calls window.print() on web, which prints
      // the current page, so we use a hidden iframe instead.
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
          showMessage('PDF Error', 'Unable to open the print preview.');
          return;
        }

        frameDoc.open();
        frameDoc.write(html);
        frameDoc.close();

        // Chrome uses the page title as the default PDF file name
        const previousTitle = document.title;
        document.title = filename.replace(/\.pdf$/i, '');

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

      // iOS: print / share dialog
      if (Platform.OS !== 'android') {
        await Print.printAsync({ html });
        return;
      }

      // Android: save PDF directly into the selected folder
      const pdf = await Print.printToFileAsync({
        html,
        base64: true,
      });

      const base64Data = pdf.base64;

      if (!base64Data) {
        showMessage(
          'PDF Error',
          'Unable to create the quotation PDF.'
        );
        return;
      }

      const permissionFile =
        `${FileSystem.documentDirectory}homeease_download_directory.txt`;

      let directoryUri: string | null = null;

      try {
        directoryUri = await FileSystem.readAsStringAsync(permissionFile);
      } catch {
        directoryUri = null;
      }

      if (!directoryUri) {
        const permission =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permission.granted || !permission.directoryUri) {
          showMessage(
            'Permission Required',
            'Please select a folder (for example Documents or a new "HomeEase" folder) to save the quotation PDF.'
          );
          return;
        }

        directoryUri = permission.directoryUri;

        await FileSystem.writeAsStringAsync(
          permissionFile,
          directoryUri
        );
      }

      try {
        const fileUri =
          await FileSystem.StorageAccessFramework.createFileAsync(
            directoryUri,
            filename.replace(/\.pdf$/i, ''),
            'application/pdf'
          );

        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        showMessage(
          'PDF Saved',
          `Quotation PDF saved successfully:\n${filename}`
        );
      } catch (saveError) {
        console.error('PDF save error:', saveError);

        try {
          await FileSystem.deleteAsync(permissionFile, {
            idempotent: true,
          });
        } catch {}

        showMessage(
          'Unable to Save PDF',
          'Please tap Download PDF again and select a folder again.'
        );
      }
    } catch (error) {
      console.error('Quotation PDF error:', error);

      showMessage(
        'PDF Error',
        'Unable to create the quotation PDF. Please try again.'
      );
    }
  };

  const renderQuotationDetails = (booking: AdminBooking) => {
    if (!booking.quotation) return null;

    const quotation = booking.quotation;
    const quotationHistory = booking.quotationHistory ?? [];

    return (
      <View style={styles.quotationDetails}>
        <Text style={styles.sectionSubtitle}>
          Quotation Details
        </Text>

        <Text style={styles.detailText}>
          Version: {quotation.version || 1}
        </Text>

        <Text style={styles.detailText}>
          Status: {booking.quotationStatus || 'Sent'}
        </Text>

        {(quotation.items || []).map((item, index) => (
          <View
            key={`${booking.id}-quotation-${index}`}
            style={styles.quotationItemRow}
          >
            <Text style={styles.quotationItemDescription}>
              {item.description}
            </Text>

            <Text style={styles.quotationItemAmount}>
              ₹{Number(item.amount).toLocaleString('en-IN')}
            </Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>

          <Text style={styles.totalAmount}>
            ₹{Number(
              quotation.totalAmount || 0
            ).toLocaleString('en-IN')}
          </Text>
        </View>

        <Text style={styles.detailText}>
          Work: {quotation.workDescription || '-'}
        </Text>

        <Text style={styles.detailText}>
          Estimated Duration: {quotation.estimatedDuration || '-'}
        </Text>

        <Text style={styles.detailText}>
          Warranty: {quotation.warranty || 'Not specified'}
        </Text>

        <Pressable
          style={styles.downloadButton}
          onPress={() => handleDownloadQuotation(booking)}
        >
          <Text style={styles.downloadButtonText}>
            Download Quotation PDF
          </Text>
        </Pressable>

        {quotationHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.sectionSubtitle}>
              Previous Quotations
            </Text>

            {quotationHistory.map((previous, index) => (
              <View
                key={`${booking.id}-history-${index}`}
                style={styles.historyItem}
              >
                <Text style={styles.detailText}>
                  Version {previous.version || index + 1}
                </Text>

                <Text style={styles.detailText}>
                  Amount: ₹{Number(
                    previous.totalAmount || 0
                  ).toLocaleString('en-IN')}
                </Text>

                <Text style={styles.detailText}>
                  Date: {previous.createdAt
                    ? new Date(previous.createdAt).toLocaleDateString('en-IN')
                    : '-'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderBooking = (booking: AdminBooking) => {
    const bookingKey = `${booking.userId}_${booking.id}`;
    const isExpanded = selectedBookingId === bookingKey;

    return (
      <View key={bookingKey} style={styles.bookingCard}>
        <Pressable
          style={styles.bookingHeader}
          onPress={() => toggleBookingDetails(booking)}
        >
          <View style={styles.bookingHeaderInfo}>
            <Text style={styles.bookingService}>
              {booking.service || 'Service Booking'}
            </Text>

            <Text style={styles.bookingId}>
              ID: {booking.id}
            </Text>

            <Text style={styles.bookingCustomerName}>
              {booking.name || 'Customer'}
            </Text>

            <Text style={styles.bookingDate}>
              {booking.preferredDate || '-'} • {booking.preferredTime || '-'}
            </Text>
          </View>

          <View style={styles.bookingHeaderRight}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {booking.status || 'Pending'}
              </Text>
            </View>

            <Text style={styles.expandIcon}>
              {isExpanded ? '−' : '+'}
            </Text>
          </View>
        </Pressable>

        {isExpanded && (
          <View style={styles.bookingExpanded}>
            {renderBookingCustomer(booking)}

            <Text style={styles.sectionSubtitle}>
              Booking Details
            </Text>

            <Text style={styles.detailText}>
              Booking ID: {booking.id}
            </Text>

            <Text style={styles.detailText}>
              Service: {booking.service || '-'}
            </Text>

            <Text style={styles.detailText}>
              Customer: {booking.name || '-'}
            </Text>

            <Text style={styles.detailText}>
              District: {booking.district || '-'}
            </Text>

            <Text style={styles.detailText}>
              City: {booking.city || '-'}
            </Text>

            <Text style={styles.detailText}>
              Area: {booking.area || '-'}
            </Text>

            <Text style={styles.detailText}>
              Address: {booking.address || '-'}
            </Text>

            <Text style={styles.detailText}>
              Preferred Date: {booking.preferredDate || '-'}
            </Text>

            <Text style={styles.detailText}>
              Preferred Time: {booking.preferredTime || '-'}
            </Text>

            <Text style={styles.detailText}>
              Additional Requirements: {booking.additionalRequirements || '-'}
            </Text>

            {booking.status !== 'Cancelled' &&
              booking.status !== 'Completed' && (
                <View style={styles.statusActions}>
                  {booking.status !== 'Approved' && (
                    <Pressable
                      style={styles.approveButton}
                      onPress={() =>
                        changeBookingStatus(booking, 'Approved')
                      }
                    >
                      <Text style={styles.actionButtonText}>
                        Approve
                      </Text>
                    </Pressable>
                  )}

                  {booking.status !== 'Rejected' && (
                    <Pressable
                      style={styles.rejectButton}
                      onPress={() =>
                        changeBookingStatus(booking, 'Rejected')
                      }
                    >
                      <Text style={styles.actionButtonText}>
                        Reject
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={styles.completeButton}
                    onPress={() =>
                      changeBookingStatus(booking, 'Completed')
                    }
                  >
                    <Text style={styles.actionButtonText}>
                      Complete
                    </Text>
                  </Pressable>
                </View>
              )}

            {canSendQuotation(booking) && (
              <Pressable
                style={styles.quotationButton}
                onPress={() => openQuotationForm(booking)}
              >
                <Text style={styles.actionButtonText}>
                  {booking.quotationStatus === 'Rejected'
                    ? 'Send Revised Quotation'
                    : 'Create Quotation'}
                </Text>
              </Pressable>
            )}

            {renderQuotationDetails(booking)}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B85D32" />

        <Text style={styles.loadingText}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  const filteredBookings = bookings.filter((booking) => {
    if (bookingFilter === 'All') return true;

    if (bookingFilter === 'Pending') {
      return (
        booking.status === 'Pending' ||
        booking.status === 'Waiting for Provider Response'
      );
    }

    return booking.status === bookingFilter;
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>HomeEase Admin</Text>

          <Text style={styles.headerSubtitle}>
            Manage bookings and customers
          </Text>
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {customers.length}
            </Text>

            <Text style={styles.statLabel}>Customers</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {bookings.length}
            </Text>

            <Text style={styles.statLabel}>Bookings</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {
                bookings.filter(
                  (booking) =>
                    booking.status === 'Pending' ||
                    booking.status === 'Waiting for Provider Response'
                ).length
              }
            </Text>

            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Customers</Text>

        {customers.length === 0 ? (
          <Text style={styles.emptyText}>No customers found.</Text>
        ) : (
          customers.map(renderCustomer)
        )}

        <Text style={styles.sectionTitle}>Bookings</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {BOOKING_FILTERS.map((filter) => (
            <Pressable
              key={filter}
              style={[
                styles.filterButton,
                bookingFilter === filter && styles.activeFilterButton,
              ]}
              onPress={() => setBookingFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  bookingFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {filteredBookings.length === 0 ? (
          <Text style={styles.emptyText}>No bookings found.</Text>
        ) : (
          filteredBookings.map(renderBooking)
        )}
      </ScrollView>

      <Modal
        visible={quotationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQuotationModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Create Quotation
              </Text>

              <Pressable
                onPress={() => setQuotationModalVisible(false)}
              >
                <Text style={styles.closeButton}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>Quotation Items</Text>

              {quotationItems.map((item, index) => (
                <View
                  key={item.id}
                  style={styles.quotationInputCard}
                >
                  <Text style={styles.itemNumber}>
                    Item {index + 1}
                  </Text>

                  <TextInput
                    style={styles.textInput}
                    placeholder="Description"
                    placeholderTextColor="#A38D80"
                    value={item.description}
                    onChangeText={(value) =>
                      updateQuotationItem(index, 'description', value)
                    }
                  />

                  <TextInput
                    style={styles.textInput}
                    placeholder="Amount (₹)"
                    placeholderTextColor="#A38D80"
                    keyboardType="numeric"
                    value={item.amount}
                    onChangeText={(value) =>
                      updateQuotationItem(index, 'amount', value)
                    }
                  />

                  {quotationItems.length > 1 && (
                    <Pressable
                      style={styles.removeItemButton}
                      onPress={() => removeQuotationItem(index)}
                    >
                      <Text style={styles.removeItemText}>
                        Remove Item
                      </Text>
                    </Pressable>
                  )}
                </View>
              ))}

              <Pressable
                style={styles.addItemButton}
                onPress={addQuotationItem}
              >
                <Text style={styles.addItemText}>+ Add Item</Text>
              </Pressable>

              <View style={styles.totalPreview}>
                <Text style={styles.totalPreviewLabel}>
                  Total Amount
                </Text>

                <Text style={styles.totalPreviewAmount}>
                  ₹{quotationTotal.toLocaleString('en-IN')}
                </Text>
              </View>

              <Text style={styles.inputLabel}>Work Description</Text>

              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Describe the work to be completed"
                placeholderTextColor="#A38D80"
                multiline
                value={workDescription}
                onChangeText={setWorkDescription}
              />

              <Text style={styles.inputLabel}>Estimated Duration</Text>

              <TextInput
                style={styles.textInput}
                placeholder="Example: 2-3 hours"
                placeholderTextColor="#A38D80"
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
              />

              <Text style={styles.inputLabel}>Warranty (Optional)</Text>

              <TextInput
                style={styles.textInput}
                placeholder="Example: 30 days"
                placeholderTextColor="#A38D80"
                value={warranty}
                onChangeText={setWarranty}
              />

              <Pressable
                style={styles.sendQuotationButton}
                onPress={sendQuotation}
              >
                <Text style={styles.sendQuotationText}>
                  Send Quotation
                </Text>
              </Pressable>

              <Pressable
                style={styles.cancelModalButton}
                onPress={() => setQuotationModalVisible(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1E5',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF1E5',
  },

  loadingText: {
    marginTop: 12,
    color: '#8C756A',
    fontSize: 14,
  },

  header: {
    backgroundColor: '#B85D32',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },

  headerSubtitle: {
    color: '#FCE8D9',
    fontSize: 12,
    marginTop: 4,
  },

  logoutButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 10,
  },

  logoutButtonText: {
    color: '#B85D32',
    fontWeight: 'bold',
    fontSize: 12,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 25,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
  },

  statNumber: {
    color: '#B85D32',
    fontSize: 24,
    fontWeight: 'bold',
  },

  statLabel: {
    color: '#8C756A',
    fontSize: 12,
    marginTop: 5,
  },

  sectionTitle: {
    color: '#392D28',
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 12,
  },

  sectionSubtitle: {
    color: '#B85D32',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },

  emptyText: {
    color: '#8C756A',
    fontSize: 14,
    padding: 15,
    textAlign: 'center',
  },

  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 1,
  },

  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },

  customerInfo: {
    flex: 1,
  },

  customerName: {
    color: '#392D28',
    fontSize: 15,
    fontWeight: 'bold',
  },

  customerEmail: {
    color: '#8C756A',
    fontSize: 12,
    marginTop: 4,
  },

  customerPhone: {
    color: '#8C756A',
    fontSize: 12,
    marginTop: 3,
  },

  customerRight: {
    alignItems: 'center',
  },

  bookingCount: {
    color: '#B85D32',
    fontSize: 11,
    fontWeight: 'bold',
  },

  expandIcon: {
    color: '#B85D32',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
  },

  customerExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#F0E1D7',
    padding: 15,
  },

  detailText: {
    color: '#6E5B51',
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 4,
  },

  customerMiniCard: {
    backgroundColor: '#FFF7F0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },

  customerMiniName: {
    color: '#392D28',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  customerMiniText: {
    color: '#8C756A',
    fontSize: 12,
    marginTop: 3,
  },

  chatButton: {
    backgroundColor: '#456F9E',
    padding: 12,
    borderRadius: 9,
    alignItems: 'center',
    marginTop: 12,
  },

  filterContainer: {
    gap: 8,
    paddingBottom: 12,
  },

  filterButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8D8CC',
  },

  activeFilterButton: {
    backgroundColor: '#B85D32',
    borderColor: '#B85D32',
  },

  filterText: {
    color: '#8C756A',
    fontSize: 12,
    fontWeight: '600',
  },

  activeFilterText: {
    color: '#FFFFFF',
  },

  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
  },

  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },

  bookingHeaderInfo: {
    flex: 1,
  },

  bookingService: {
    color: '#392D28',
    fontSize: 16,
    fontWeight: 'bold',
  },

  bookingId: {
    color: '#A38D80',
    fontSize: 10,
    marginTop: 4,
  },

  bookingCustomerName: {
    color: '#6E5B51',
    fontSize: 12,
    marginTop: 5,
  },

  bookingDate: {
    color: '#8C756A',
    fontSize: 11,
    marginTop: 5,
  },

  bookingHeaderRight: {
    alignItems: 'center',
    marginLeft: 8,
  },

  statusBadge: {
    backgroundColor: '#FFF1E5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusText: {
    color: '#B85D32',
    fontSize: 10,
    fontWeight: 'bold',
  },

  bookingExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#F0E1D7',
    padding: 15,
  },

  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
  },

  approveButton: {
    backgroundColor: '#36865A',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 9,
  },

  rejectButton: {
    backgroundColor: '#C64C43',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 9,
  },

  completeButton: {
    backgroundColor: '#456F9E',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 9,
  },

  quotationButton: {
    backgroundColor: '#B85D32',
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  quotationDetails: {
    backgroundColor: '#FFF7F0',
    padding: 13,
    borderRadius: 12,
    marginTop: 15,
  },

  quotationItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D8CC',
  },

  quotationItemDescription: {
    flex: 1,
    color: '#6E5B51',
    fontSize: 12,
  },

  quotationItemAmount: {
    color: '#392D28',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 10,
  },

  totalLabel: {
    color: '#392D28',
    fontSize: 14,
    fontWeight: 'bold',
  },

  totalAmount: {
    color: '#B85D32',
    fontSize: 16,
    fontWeight: 'bold',
  },

  downloadButton: {
    backgroundColor: '#456F9E',
    padding: 12,
    borderRadius: 9,
    alignItems: 'center',
    marginTop: 12,
  },

  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  historyContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E8D8CC',
    marginTop: 15,
    paddingTop: 8,
  },

  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 15,
  },

  modalContainer: {
    backgroundColor: '#FFF1E5',
    borderRadius: 18,
    padding: 18,
    maxHeight: '90%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  modalTitle: {
    color: '#392D28',
    fontSize: 19,
    fontWeight: 'bold',
  },

  closeButton: {
    color: '#B85D32',
    fontSize: 22,
    fontWeight: 'bold',
    padding: 5,
  },

  inputLabel: {
    color: '#392D28',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 7,
  },

  quotationInputCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  itemNumber: {
    color: '#B85D32',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D8CC',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#392D28',
    fontSize: 13,
    marginBottom: 9,
  },

  multilineInput: {
    minHeight: 85,
    textAlignVertical: 'top',
  },

  removeItemButton: {
    alignSelf: 'flex-end',
    paddingVertical: 5,
  },

  removeItemText: {
    color: '#C64C43',
    fontSize: 12,
    fontWeight: 'bold',
  },

  addItemButton: {
    borderWidth: 1,
    borderColor: '#B85D32',
    borderStyle: 'dashed',
    padding: 12,
    borderRadius: 9,
    alignItems: 'center',
    marginBottom: 12,
  },

  addItemText: {
    color: '#B85D32',
    fontSize: 13,
    fontWeight: 'bold',
  },

  totalPreview: {
    backgroundColor: '#F5DFD0',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalPreviewLabel: {
    color: '#392D28',
    fontSize: 14,
    fontWeight: 'bold',
  },

  totalPreviewAmount: {
    color: '#B85D32',
    fontSize: 18,
    fontWeight: 'bold',
  },

  sendQuotationButton: {
    backgroundColor: '#B85D32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },

  sendQuotationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  cancelModalButton: {
    padding: 13,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
  },

  cancelModalText: {
    color: '#8C756A',
    fontSize: 13,
    fontWeight: 'bold',
  },
});