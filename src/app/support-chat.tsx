
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

import { useRouter } from 'expo-router';

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

import { auth, db } from '../lib/firebase';

type ChatMessage = {
  id: string;
  text: string;
  sender: string;
  senderId: string;
  createdAt?: {
    toDate: () => Date;
  } | null;
};

export default function SupportChatScreen() {
  const router = useRouter();

const listRef = useRef<FlatList<ChatMessage> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Listen to the current customer's support messages
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;

    const loadMessages = async () => {
      try {
        await auth.authStateReady();

        const user = auth.currentUser;

        if (!user) {
          if (active) {
            setLoading(false);

            Alert.alert(
              'Login Required',
              'Please login to contact HomeEase Support.',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/auth'),
                },
              ]
            );
          }

          return;
        }

        const messagesRef = collection(
          db,
          'users',
          user.uid,
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
            console.log('Chat loading error:', error);

            if (active) {
              setLoading(false);

              Alert.alert(
                'Chat Error',
                'Unable to load your messages. Please try again.'
              );
            }
          }
        );
      } catch (error) {
        console.log('Support chat error:', error);

        if (active) {
          setLoading(false);

          Alert.alert(
            'Error',
            'Unable to open HomeEase Support.'
          );
        }
      }
    };

    void loadMessages();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [router]);

  // Send a message
  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    if (trimmedMessage.length > 2000) {
      Alert.alert(
        'Message Too Long',
        'Please keep your message within 2000 characters.'
      );
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        'Login Required',
        'Please login to send a support message.'
      );

      router.replace('/auth');
      return;
    }

    try {
      setSending(true);

      const messagesRef = collection(
        db,
        'users',
        user.uid,
        'supportMessages'
      );

      await addDoc(messagesRef, {
        text: trimmedMessage,
        sender: 'customer',
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });

      setMessage('');
    } catch (error) {
      console.log('Sending message error:', error);

      Alert.alert(
        'Unable to Send',
        'Your message could not be sent. Please try again.'
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

  // Display each chat message
  const renderMessage = ({
    item,
  }: {
    item: ChatMessage;
  }) => {
    const isCustomer = item.sender === 'customer';

    return (
      <View
        style={[
          styles.messageRow,
          isCustomer ? styles.customerRow : styles.supportRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isCustomer
              ? styles.customerBubble
              : styles.supportBubble,
          ]}
        >
          {!isCustomer && (
            <Text style={styles.senderName}>
              HomeEase Support
            </Text>
          )}

          <Text
            style={[
              styles.messageText,
              isCustomer && styles.customerMessageText,
            ]}
          >
            {item.text}
          </Text>

          <Text
            style={[
              styles.messageTime,
              isCustomer && styles.customerMessageTime,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#B85D32"
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerIcon}>
          <Text style={styles.headerEmoji}>💬</Text>
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            HomeEase Support
          </Text>

          <Text style={styles.headerSubtitle}>
            We're here to help you
          </Text>
        </View>
      </View>

      {/* Information */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          How can we help you?
        </Text>

        <Text style={styles.infoText}>
          Send us your questions about bookings, services
          or any problems you face with HomeEase.
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
          <View style={styles.emptyChat}>
            <Text style={styles.emptyIcon}>👋</Text>

            <Text style={styles.emptyTitle}>
              Welcome to HomeEase Support!
            </Text>

            <Text style={styles.emptyText}>
              Send us a message. Your conversation
              will appear here.
            </Text>
          </View>
        }
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type your message..."
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 55,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAD8C9',
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF1E5',
  },

  backText: {
    fontSize: 30,
    color: '#B85D32',
    marginTop: -3,
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#FCE5DC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  headerEmoji: {
    fontSize: 23,
  },

  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#392D28',
  },

  headerSubtitle: {
    fontSize: 12,
    color: '#8C756A',
    marginTop: 3,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    margin: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B85D32',
  },

  infoText: {
    fontSize: 13,
    color: '#8C756A',
    lineHeight: 20,
    marginTop: 6,
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

  customerRow: {
    justifyContent: 'flex-end',
  },

  supportRow: {
    justifyContent: 'flex-start',
  },

  messageBubble: {
    maxWidth: '82%',
    padding: 13,
    borderRadius: 15,
  },

  customerBubble: {
    backgroundColor: '#B85D32',
    borderBottomRightRadius: 3,
  },

  supportBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderBottomLeftRadius: 3,
  },

  senderName: {
    color: '#B85D32',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  messageText: {
    color: '#392D28',
    fontSize: 14,
    lineHeight: 21,
  },

  customerMessageText: {
    color: '#FFFFFF',
  },

  messageTime: {
    fontSize: 10,
    color: '#8C756A',
    textAlign: 'right',
    marginTop: 6,
  },

  customerMessageTime: {
    color: '#FFE2D1',
  },

  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#392D28',
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 13,
    color: '#8C756A',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
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
