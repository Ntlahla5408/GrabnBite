import { router, Stack } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppThemeColors, useThemePreference } from "../context/ThemeContext";
import { useAuth } from "../context/authContext";
import { ChatMessage, sendChatMessage } from "../services/chatService";

const SUGGESTED_QUESTIONS = [
  "How do I place an order?",
  "How do payments work?",
  "Where can I find the policies?",
  "How can I contact support?",
];

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm the GrabnBite support assistant. I can help with general questions about using the app, ordering, payments and account support. What would you like help with?",
};

export default function ChatbotScreen() {
  const { token, user } = useAuth();
  const { theme } = useThemePreference();
  const colors = AppThemeColors[theme];
  const { width, height } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 768;

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const closeChat = useCallback(() => {
    router.back();
  }, []);

  const submitMessage = useCallback(async (providedMessage?: string) => {
    const messageText = (providedMessage ?? draft).trim();

    if (!messageText || isSending) {
      return;
    }

    if (!token || user?.role?.toLowerCase() !== "customer") {
      setErrorMessage("Please sign in with your customer account to use support chat.");
      return;
    }

    const previousMessages = messages.filter(
      (message) => message.id !== "welcome",
    );
    const history = previousMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const customerMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText,
    };

    setMessages((currentMessages) => [...currentMessages, customerMessage]);
    setDraft("");
    setErrorMessage("");
    setIsSending(true);

    try {
      const reply = await sendChatMessage(messageText, history);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
      };
      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (error) {
      const typedError = error as Error & { status?: number };
      if (typedError.status === 401 || typedError.status === 403) {
        setErrorMessage("Your session may have expired. Please sign in again.");
      } else if (typedError.status === 503) {
        setErrorMessage("The support assistant is temporarily unavailable. Please try again shortly.");
      } else {
        setErrorMessage("We couldn't send your message. Check your connection and try again.");
      }
      console.warn("Customer support chat request failed:", typedError.message);
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [draft, isSending, messages, token, user?.role]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isCustomer = item.role === "user";
    return (
      <View style={[styles.messageRow, isCustomer ? styles.customerRow : styles.assistantRow]}>
        {!isCustomer && (
          <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.avatarText, { color: colors.accent }]}>G</Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isCustomer
              ? { backgroundColor: colors.accent }
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
          ]}
        >
          <Text style={[styles.messageText, { color: isCustomer ? "#FFFFFF" : colors.text }]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const chatContent = (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {isDesktopWeb ? (
          <>
            <View style={[styles.headerAvatar, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.avatarText, { color: colors.accent }]}>G</Text>
            </View>
            <View style={styles.headerCopy}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>GrabnBite Support</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>AI assistant · General help</Text>
            </View>
            <Pressable
              onPress={() => setIsMinimized(true)}
              style={styles.headerAction}
              accessibilityRole="button"
              accessibilityLabel="Minimize support chat"
            >
              <Text style={[styles.headerActionText, { color: colors.text }]}>−</Text>
            </Pressable>
            <Pressable
              onPress={closeChat}
              style={styles.headerAction}
              accessibilityRole="button"
              accessibilityLabel="Close support chat"
            >
              <Text style={[styles.headerActionText, { color: colors.text }]}>×</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={closeChat} style={styles.backButton} accessibilityLabel="Go back">
              <Text style={[styles.backText, { color: colors.text }]}>‹</Text>
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>GrabnBite Support</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>AI assistant · General help</Text>
            </View>
            <View style={[styles.onlineDot, { backgroundColor: "#22C55E" }]} />
          </>
        )}
      </View>

      <View style={styles.noticeWrap}>
        <Text style={[styles.notice, { color: colors.textSecondary }]}>
          For account-specific, order or payment issues, use the relevant section in the app. This assistant cannot view your live account or order records.
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          isSending ? (
            <View style={styles.typingRow}>
              <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.avatarText, { color: colors.accent }]}>G</Text>
              </View>
              <View style={[styles.typingBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={[styles.typingText, { color: colors.textSecondary }]}>Thinking...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {messages.length === 1 && (
        <View style={styles.suggestions}>
          <Text style={[styles.suggestionHeading, { color: colors.textSecondary }]}>SUGGESTED QUESTIONS</Text>
          <View style={styles.suggestionList}>
            {SUGGESTED_QUESTIONS.map((question) => (
              <Pressable
                key={question}
                disabled={isSending}
                onPress={() => void submitMessage(question)}
                style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.suggestionText, { color: colors.text }]}>{question}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {errorMessage !== "" && (
        <View style={[styles.errorBanner, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.errorText, { color: colors.text }]}>{errorMessage}</Text>
        </View>
      )}

      <View style={[styles.composer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask us anything..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
          multiline
          maxLength={2000}
          editable={!isSending}
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={() => void submitMessage()}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={!draft.trim() || isSending}
          onPress={() => void submitMessage()}
          style={[
            styles.sendButton,
            { backgroundColor: colors.accent },
            (!draft.trim() || isSending) && styles.sendDisabled,
          ]}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );

  if (isDesktopWeb) {
    return (
      <>
        <Stack.Screen
          options={{
            presentation: "transparentModal",
            animation: "fade",
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <View style={styles.desktopOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeChat}
            accessibilityRole="button"
            accessibilityLabel="Close support chat"
          />
          {isMinimized ? (
            <Pressable
              onPress={() => setIsMinimized(false)}
              style={[styles.minimizedChat, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Restore support chat"
            >
              <View style={[styles.headerAvatar, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.avatarText, { color: colors.accent }]}>G</Text>
              </View>
              <View style={styles.headerCopy}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>GrabnBite Support</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Chat minimized · Open chat</Text>
              </View>
              <Text style={[styles.headerActionText, { color: colors.text }]}>⌃</Text>
            </Pressable>
          ) : (
            <View
              style={[
                styles.desktopPanel,
                {
                  width: Math.min(width - 40, 420),
                  height: Math.min(height - 48, 680),
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
                {chatContent}
              </SafeAreaView>
            </View>
          )}
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ presentation: "card" }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
        {chatContent}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  desktopOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10, 20, 30, 0.18)",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 24,
  },
  desktopPanel: {
    maxWidth: "100%",
    maxHeight: "100%",
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
    elevation: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  minimizedChat: {
    width: 300,
    maxWidth: "100%",
    minHeight: 68,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  },
  header: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerAction: { width: 34, height: 38, alignItems: "center", justifyContent: "center", marginLeft: 4 },
  headerActionText: { fontSize: 25, lineHeight: 30, fontWeight: "500" },
  backButton: { width: 38, height: 42, justifyContent: "center" },
  backText: { fontSize: 36, lineHeight: 40 },
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "800" },
  headerSubtitle: { fontSize: 11, marginTop: 3 },
  onlineDot: { width: 9, height: 9, borderRadius: 5, marginRight: 4 },
  noticeWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 2 },
  notice: { fontSize: 11, lineHeight: 16 },
  messageList: { paddingHorizontal: 14, paddingTop: 18, paddingBottom: 14, flexGrow: 1 },
  messageRow: { flexDirection: "row", marginBottom: 14, alignItems: "flex-end" },
  customerRow: { justifyContent: "flex-end" },
  assistantRow: { justifyContent: "flex-start" },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 7 },
  avatarText: { fontSize: 13, fontWeight: "900" },
  messageBubble: { maxWidth: "82%", paddingHorizontal: 14, paddingVertical: 11, borderRadius: 18 },
  messageText: { fontSize: 14, lineHeight: 20 },
  typingRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  typingBubble: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10 },
  typingText: { fontSize: 12 },
  suggestions: { paddingHorizontal: 16, paddingBottom: 12 },
  suggestionHeading: { fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 9 },
  suggestionList: { gap: 8 },
  suggestionChip: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  suggestionText: { fontSize: 12, fontWeight: "600" },
  errorBanner: { marginHorizontal: 14, marginBottom: 8, borderRadius: 10, padding: 10 },
  errorText: { fontSize: 12, lineHeight: 17 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 9, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1 },
  input: { flex: 1, minHeight: 44, maxHeight: 112, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, fontSize: 14 },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  sendDisabled: { opacity: 0.45 },
  sendIcon: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", marginLeft: 2 },
});
