
import { useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

import { signOut } from 'firebase/auth';

import { auth, db } from '../lib/firebase';

const ADMIN_UID = 'XORlsuEUPYfsmlFqgXCSaoY1jvz1';

type ChatMessage = {
  id: string;
  text: string;
  sender: 'customer' | 'support';
  senderId: string;
  createdAt?: {
    toDate: () => Date;
  } | null;
};

export default function AdminChatScreen() {
  const router = useRouter();

  const {
    userId,
    customerName,
    customerEmail,
    customerPhone,
  } = useLocalSearchParams<{
    userId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const listRef = useRef<FlatList<ChatMessage> | null>(null);

  // Verify Admin and listen to the selected customer's chat
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const loadChat = async () => {
      try {
        await auth.authStateReady();

        const currentUser = auth.currentUser;

        if (!currentUser || currentUser.uid !== ADMIN_UID) {
          if (active) {
            Alert.alert(
              'Access Denied',
              'Only HomeEase Admin can access customer conversations.'
            );

            router.replace('/admin-login');
          }

          return;
        }

        if (!userId) {
          Alert.alert('Error', 'Customer information is missing.');
          router.back();
          return;
        }

        const messagesRef = collection(
          db,
          'users',
          userId,
          'supportMessages'
        );

        const messagesQuery = query(
          messagesRef,
          orderBy('createdAt', 'asc')
        );

        unsubscribe = onSnapshot(
          messagesQuery,
          (snapshot) => {
            if (!active) return;

            const chatMessages: ChatMessage[] =
              snapshot.docs.map((item) => ({
                id: item.id,
                ...(item.data() as Omit<ChatMessage, 'id'>),
              }));

            setMessages(chatMessages);
            setLoading(false);
          },
          (error) => {
            console.log('Admin chat loading error:', error);

            if (active) {
              setLoading(false);

              Alert.alert(
                'Chat Error',
                'Unable to load this customer conversation.'
              );
            }
          }
        );
      } catch (error) {
        console.log('Admin chat error:', error);

        if (active) {
          setLoading(false);

          Alert.alert(
            'Error',
            'Unable to open the customer conversation.'
          );
        }
      }
    };

    void loadChat();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [userId, router]);

  // Send an Admin reply
  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    if (trimmedMessage.length > 2000) {
      Alert.alert(
        'Message Too Long',
        'Please keep your message within 2000 characters.'
      );
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser || currentUser.uid !== ADMIN_UID) {
      Alert.alert(
        'Access Denied',
        'Only the authorized Admin can send support replies.'
      );

      router.replace('/admin-login');
      return;
    }

    if (!userId) return;

    try {
      setSending(true);

      const messagesRef = collection(
        db,
        'users',
        userId,
        'supportMessages'
      );

      await addDoc(messagesRef, {
        text: trimmedMessage,
        sender: 'support',
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setMessage('');
    } catch (error) {
      console.log('Admin reply error:', error);

      Alert.alert(
        'Unable to Send',
        'Your reply could not be sent. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  // Format message time
  const formatTime = (createdAt?: ChatMessage['createdAt']) => {
    if (!createdAt?.toDate) {
      return 'Sending...';
    }

    return createdAt.toDate().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render individual messages
  const renderMessage = ({
    item,
  }: {
    item: ChatMessage;
  }) => {
    const isSupport = item.sender === 'support';

    return (
      <View
        style={[
          styles.messageRow,
          isSupport ? styles.adminRow : styles.customerRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isSupport ? styles.adminBubble : styles.customerBubble,
          ]}
        >
          <Text style={styles.senderName}>
            {isSupport ? 'HomeEase Support' : customerName || 'Customer'}
          </Text>

          <Text
            style={[
              styles.messageText,
              isSupport && styles.adminMessageText,
            ]}
          >
            {item.text}
          </Text>

          <Text
            style={[
              styles.messageTime,
              isSupport && styles.adminMessageTime,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  // Admin logout
  const handleLogout = () => {
    Alert.alert(
      'Admin Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/admin-login');
            } catch (error) {
              Alert.alert('Error', 'Unable to logout.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#B85D32" />
        <Text style={styles.loadingText}>
          Loading conversation...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {customerName || 'Customer'}
          </Text>

          <Text style={styles.headerSubtitle}>
            Customer Support Conversation
          </Text>
        </View>

        <Pressable onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {/* Customer Details */}
      <View style={styles.customerCard}>
        <Text style={styles.customerName}>
          {customerName || 'HomeEase Customer'}
        </Text>

        <Text style={styles.customerDetail}>
          {customerEmail || 'Email not available'}
        </Text>

        <Text style={styles.customerDetail}>
          {customerPhone || 'Phone not available'}
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>💬</Text>

            <Text style={styles.emptyText}>
              No messages from this customer yet.
            </Text>
          </View>
        }
      />

      {/* Admin Reply Box */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type your reply..."
          placeholderTextColor="#A9978D"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={2000}
          editable={!sending}
        />

        <Pressable
          style={[
            styles.sendButton,
            (!message.trim() || sending) && styles.disabledButton,
          ]}
          onPress={handleSend}
          disabled={!message.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1E5',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF1E5',
  },

  loadingText: {
    color: '#8C756A',
    marginTop: 12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 55,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAD8C9',
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF1E5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backText: {
    fontSize: 30,
    color: '#B85D32',
    marginTop: -3,
  },

  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#392D28',
  },

  headerSubtitle: {
    fontSize: 11,
    color: '#8C756A',
    marginTop: 3,
  },

  logoutText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A33E27',
  },

  customerCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    margin: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  customerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#B85D32',
  },

  customerDetail: {
    fontSize: 12,
    color: '#8C756A',
    marginTop: 4,
  },

  messageList: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexGrow: 1,
  },

  messageRow: {
    width: '100%',
    marginBottom: 13,
    flexDirection: 'row',
  },

  adminRow: {
    justifyContent: 'flex-end',
  },

  customerRow: {
    justifyContent: 'flex-start',
  },

  messageBubble: {
    maxWidth: '82%',
    padding: 13,
    borderRadius: 15,
  },

  adminBubble: {
    backgroundColor: '#B85D32',
    borderBottomRightRadius: 3,
  },

  customerBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderBottomLeftRadius: 3,
  },

  senderName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B85D32',
    marginBottom: 5,
  },

  messageText: {
    fontSize: 14,
    color: '#392D28',
    lineHeight: 21,
  },

  adminMessageText: {
    color: '#FFFFFF',
  },

  messageTime: {
    fontSize: 10,
    color: '#8C756A',
    textAlign: 'right',
    marginTop: 6,
  },

  adminMessageTime: {
    color: '#FFE2D1',
  },

  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  emptyIcon: {
    fontSize: 35,
    marginBottom: 10,
  },

  emptyText: {
    fontSize: 14,
    color: '#8C756A',
    textAlign: 'center',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAD8C9',
    gap: 10,
  },

  messageInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 110,
    backgroundColor: '#FFF1E5',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#392D28',
    fontSize: 14,
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#B85D32',
    justifyContent: 'center',
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.5,
  },

  sendIcon: {
    fontSize: 23,
    color: '#FFFFFF',
  },
});
