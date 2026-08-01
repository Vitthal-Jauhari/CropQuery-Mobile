import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Mic, Send, Leaf, ChevronDown, X } from "lucide-react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { label: "English", value: "en" },
  { label: "Hindi", value: "hi" },
  { label: "Telugu", value: "te" },
  { label: "Tamil", value: "ta" },
  { label: "Marathi", value: "mr" },
  { label: "Bengali", value: "bn" },
];

const SEED_MESSAGES = [
  {
    id: "1",
    role: "user",
    text: "Cashew leaf miner ka kya ilaaj hai?",
    ts: Date.now() - 120000,
  },
  {
    id: "2",
    role: "ai",
    text: "Neem oil 5ml/L paani mein milakar spray karein. Sankramit pattiyaan jala dein. Peele sticky traps lagaayein aur 10 din baad dobara spray karein.",
    ts: Date.now() - 115000,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function AiAvatar() {
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#4A7C59",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
        flexShrink: 0,
        alignSelf: "flex-end",
        marginBottom: 2,
      }}
    >
      <Leaf size={16} color="#fff" />
    </View>
  );
}

function UserBubble({ text }) {
  return (
    <View
      style={{
        alignSelf: "flex-end",
        maxWidth: "78%",
        marginBottom: 14,
        alignItems: "flex-end",
      }}
    >
      <View
        style={{
          backgroundColor: "#4A7C59",
          borderRadius: 20,
          borderBottomRightRadius: 4,
          paddingHorizontal: 16,
          paddingVertical: 11,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 15, lineHeight: 22 }}>
          {text}
        </Text>
      </View>
    </View>
  );
}

function AiBubble({ text }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        maxWidth: "84%",
        alignSelf: "flex-start",
        marginBottom: 14,
      }}
    >
      <AiAvatar />
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 20,
          borderBottomLeftRadius: 4,
          paddingHorizontal: 16,
          paddingVertical: 11,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.07,
          shadowRadius: 4,
          elevation: 2,
          flex: 1,
        }}
      >
        <Text style={{ color: "#1F2937", fontSize: 15, lineHeight: 22 }}>
          {text}
        </Text>
      </View>
    </View>
  );
}

function TypingBubble() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        alignSelf: "flex-start",
        marginBottom: 14,
      }}
    >
      <AiAvatar />
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 20,
          borderBottomLeftRadius: 4,
          paddingHorizontal: 18,
          paddingVertical: 14,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.07,
          shadowRadius: 4,
          elevation: 2,
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: "#9CA3AF",
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Mock AI responses ────────────────────────────────────────────────────────

const MOCK_REPLIES = {
  en: [
    "The best time to spray is early morning between 6–8 AM when temperatures are cooler and wind is low.",
    "Yes, yellow sticky traps are very effective for monitoring adult leaf miners. Place them at plant height.",
    "Neem oil is an organic option. For severe infections, consult your local agricultural officer for chemical options.",
    "Water your cashew trees every 4–5 days during dry seasons. Avoid overwatering — it promotes fungal growth.",
    "Leaf miner damage can reduce yield by 20–30% if untreated. Act quickly for best results.",
  ],
  hi: [
    "Spray karne ka sabse achha samay subah 6–8 baje ke beech hai jab mausam thanda ho.",
    "Haan, peele sticky traps bahut prabhavi hain. Inhe plant ki unchaayi par lagaayein.",
    "Neem oil ek praakritik vikalp hai. Gambheer sankraman ke liye krishi adhikari se milein.",
    "Sukhe mausam mein har 4–5 din mein paani dein. Adhik paani se fungal infection ho sakta hai.",
    "Samay par ilaaj na kiya jaaye to paidawar 20–30% kam ho sakti hai.",
  ],
};

function getMockReply(lang) {
  const pool = MOCK_REPLIES[lang] ?? MOCK_REPLIES["en"];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AskScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const scrollRef = useRef(null);

  const [language, setLanguage] = useState("hi");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Context pill: disease name passed from Results screen
  const diseaseContext = params.diseaseName ?? null;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  // Pre-fill input if coming from Results
  useEffect(() => {
    if (diseaseContext) {
      setInputText(`Tell me more about ${diseaseContext}`);
    }
  }, [diseaseContext]);

  const sendMessage = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg = {
        id: String(Date.now()),
        role: "user",
        text: trimmed,
        ts: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setIsTyping(true);

      // Simulate AI response delay
      setTimeout(() => {
        const aiMsg = {
          id: String(Date.now() + 1),
          role: "ai",
          text: getMockReply(language),
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
      }, 1400);
    },
    [isTyping, language],
  );

  const handleMicPress = useCallback(() => {
    if (isRecording) {
      // Simulate stopping recording and sending
      setIsRecording(false);
      sendMessage("Meri fasal mein kya bimari hai?");
    } else {
      setIsRecording(true);
    }
  }, [isRecording, sendMessage]);

  const selectedLang = LANGUAGES.find((l) => l.value === language);

  return (
    <KeyboardAvoidingAnimatedView
      style={{ flex: 1, backgroundColor: "#FAF8F3" }}
      behavior="padding"
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <View
        style={{
          paddingTop: insets.top + 4,
          paddingHorizontal: 20,
          paddingBottom: 14,
          backgroundColor: "#FAF8F3",
          borderBottomWidth: 1,
          borderBottomColor: "#EBEBEB",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#4A7C59",
              }}
            >
              Ask a Question
            </Text>
            <Text style={{ fontSize: 14, color: "#9CA3AF", marginTop: 2 }}>
              Ask anything about your crop
            </Text>
          </View>

          {/* Language selector pill */}
          <TouchableOpacity
            onPress={() => setShowLangPicker(true)}
            activeOpacity={0.75}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderWidth: 1,
              borderColor: "#D1D5DB",
              gap: 4,
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151" }}>
              {selectedLang?.label}
            </Text>
            <ChevronDown size={13} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Disease context pill */}
        {diseaseContext && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFF7ED",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 7,
              marginTop: 10,
              alignSelf: "flex-start",
              borderWidth: 1,
              borderColor: "#FDE68A",
              gap: 6,
            }}
          >
            <Leaf size={13} color="#D4832A" />
            <Text style={{ fontSize: 13, color: "#92400E", fontWeight: "600" }}>
              Context: {diseaseContext}
            </Text>
          </View>
        )}
      </View>

      {/* ── Chat thread ────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingTop: 18,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: false })
        }
      >
        {/* Date separator */}
        <View style={{ alignItems: "center", marginBottom: 18 }}>
          <View
            style={{
              backgroundColor: "#E5E7EB",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>
              Today
            </Text>
          </View>
        </View>

        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserBubble key={msg.id} text={msg.text} />
          ) : (
            <AiBubble key={msg.id} text={msg.text} />
          ),
        )}

        {isTyping && <TypingBubble />}
      </ScrollView>

      {/* ── Input bar ──────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#EBEBEB",
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 10,
        }}
      >
        {/* Text input */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#F9FAFB",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            paddingHorizontal: 16,
            paddingVertical: 10,
            minHeight: 46,
            justifyContent: "center",
          }}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your question..."
            placeholderTextColor="#9CA3AF"
            multiline
            style={{
              fontSize: 15,
              color: "#1F2937",
              maxHeight: 100,
              padding: 0,
              margin: 0,
            }}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(inputText)}
            blurOnSubmit={false}
          />
        </View>

        {/* Send button — shows when there's text */}
        {inputText.trim().length > 0 && (
          <TouchableOpacity
            onPress={() => sendMessage(inputText)}
            activeOpacity={0.8}
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: "#4A7C59",
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#4A7C59",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Mic button — primary action */}
        <TouchableOpacity
          onPress={handleMicPress}
          activeOpacity={0.8}
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: isRecording ? "#EF4444" : "#4A7C59",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: isRecording ? "#EF4444" : "#4A7C59",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Mic size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Recording indicator strip */}
      {isRecording && (
        <View
          style={{
            position: "absolute",
            bottom: 80,
            left: 20,
            right: 20,
            backgroundColor: "#FEF2F2",
            borderRadius: 14,
            paddingVertical: 10,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#FECACA",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#EF4444",
              marginRight: 10,
            }}
          />
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              color: "#B91C1C",
              fontWeight: "600",
            }}
          >
            Listening… Tap mic to send
          </Text>
          <TouchableOpacity onPress={() => setIsRecording(false)}>
            <X size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Language picker bottom sheet ───────────────────────── */}
      {showLangPicker && (
        <Pressable
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowLangPicker(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: insets.bottom + 20,
            }}
          >
            {/* Handle */}
            <View
              style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#E5E7EB",
                }}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "bold",
                  color: "#4A7C59",
                }}
              >
                Select Language
              </Text>
              <TouchableOpacity onPress={() => setShowLangPicker(false)}>
                <X size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {LANGUAGES.map((lang) => {
              const active = lang.value === language;
              return (
                <TouchableOpacity
                  key={lang.value}
                  onPress={() => {
                    setLanguage(lang.value);
                    setShowLangPicker(false);
                  }}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    backgroundColor: active ? "#F0FDF4" : "#fff",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottomWidth: 1,
                    borderBottomColor: "#F9FAFB",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: active ? "#4A7C59" : "#1F2937",
                      fontWeight: active ? "700" : "400",
                    }}
                  >
                    {lang.label}
                  </Text>
                  {active && (
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: "#4A7C59",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#fff",
                        }}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      )}
    </KeyboardAvoidingAnimatedView>
  );
}
