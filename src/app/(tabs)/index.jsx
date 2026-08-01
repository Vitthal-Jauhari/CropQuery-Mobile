import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  Image as ImageIcon,
  ChevronDown,
  Check,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

const LANGUAGES = [
  { label: "English", value: "en" },
  { label: "Hindi (हिन्दी)", value: "hi" },
  { label: "Telugu (తెలుగు)", value: "te" },
  { label: "Tamil (தமிழ்)", value: "ta" },
  { label: "Marathi (मराठी)", value: "mr" },
  { label: "Bengali (বাংলা)", value: "bn" },
];

const LANGUAGE_MAP = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  ta: "Tamil",
  mr: "Marathi",
  bn: "Bengali",
};

// ─── Treatment parser ─────────────────────────────────────────────────────────
function parseTreatment(adviceText, fallback = []) {
  if (!adviceText) return fallback;
  const lines = adviceText
    .split("\n")
    .map((l) => l.replace(/^[\*\-\•\d+\.]\s*/, "").trim())
    .filter(
      (l) =>
        l.length > 20 &&
        !l.startsWith("🌿") &&
        !l.startsWith("⚠️") &&
        !l.startsWith("✅") &&
        !l.startsWith("📅") &&
        !l.startsWith("🌦") &&
        !l.startsWith("📞") &&
        !l.startsWith("❓")
    );
  const steps = lines.slice(0, 4);
  return steps.length > 0 ? steps : fallback;
}

// ─── Hardcoded offline result ─────────────────────────────────────────────────
const HARDCODED_RESULT = {
  disease: "Cashew Leaf Miner",
  scientific_name: "Acrocercops syngramma",
  confidence: 0.87,
  severity: "Moderate",
  crop: "Cashew",
  treatment: [
    "Apply neem oil spray at 5ml/L water",
    "Remove and burn all infected leaves immediately",
    "Spray Lambda-cyhalothrin 5EC at 1ml/L water",
    "Repeat spray after 10 days if infection persists",
  ],
  disclaimer: "Consult an agricultural expert before applying any chemicals",
  weather: { temp_c: 31, humidity: 72, rain_prob: 15, wind_kmh: 8 },
  spray_advice:
    "Good conditions for spraying today — low wind, no rain expected",
  irrigation_days: 3,
  water_mm: 45,
  faiss_matches: 3,
  agrobench_score: 76.2,
};

const API_URL = "https://9b23-8-234-215-142.ngrok-free.app";

export default function DiagnoseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [language, setLanguage] = useState("en");
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera permissions to make this work!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  }, []);

  const handleDiagnose = async () => {
    console.log("DIAGNOSE TAPPED, image:", image);
    try {
      const r = await fetch("https://api.github.com");
      console.log("GITHUB TEST status:", r.status);
    } catch (e) {
      console.log("GITHUB TEST failed:", e.message);
    }
    try {
      const r2 = await fetch(`${API_URL}/health`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      console.log("NGROK HEALTH status:", r2.status, await r2.text());
    } catch (e) {
      console.log("NGROK HEALTH failed:", e.message);
    }
    if (!image) {
      alert("Please take or upload a photo first");
      return;
    }
    setIsAnalyzing(true);

    let result = {
      ...HARDCODED_RESULT,
      treatment: parseTreatment(
        HARDCODED_RESULT.advice,
        HARDCODED_RESULT.treatment
      ),
    };

    try {
      const formData = new FormData();

      // --- CROSS-PLATFORM FIX IMPLEMENTED HERE ---
      const blobResponse = await fetch(image);
      const blob = await blobResponse.blob();
      formData.append("image", blob, "crop.jpg");
      // -------------------------------------------

      formData.append("farmer_question", "What is wrong with my crop?");
      formData.append("target_language", LANGUAGE_MAP[language] || "English");

      const response = await fetch(`${API_URL}/diagnose`, {
        method: "POST",
        body: formData,
        headers: { "ngrok-skip-browser-warning": "true" },
      });

      console.log("status:", response.status, "ok:", response.ok);

      if (response.ok) {
        const apiData = await response.json();
        console.log("apiData:", JSON.stringify(apiData).slice(0, 300));
        result = {
          ...apiData,
          treatment: parseTreatment(apiData.advice, apiData.treatment ?? []),
        };
      } else {
        const text = await response.text();
        console.log("error body:", text.slice(0, 300));
      }
    } catch (e) {
      console.log("API unavailable, using offline fallback:", e.message);
    }

    setIsAnalyzing(false);
    router.push({
      pathname: "/(tabs)/results",
      params: {
        image,
        language,
        result: JSON.stringify(result),
      },
    });
  };

  const selectedLanguage = LANGUAGES.find((l) => l.value === language);

  return (
    <View
      style={{ flex: 1, backgroundColor: "#FAF8F3", paddingTop: insets.top }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#4A7C59",
              marginBottom: 8,
            }}
          >
            CropQuery
          </Text>
          <Text style={{ fontSize: 17, color: "#6B7280" }}>
            AI Assistant for Indian Farmers
          </Text>
        </View>

        {/* Image Upload Area */}
        <TouchableOpacity
          onPress={image ? () => setImage(null) : takePhoto}
          style={{
            height: 300,
            backgroundColor: "#fff",
            borderRadius: 20,
            borderWidth: 2,
            borderColor: "#4A7C59",
            borderStyle: "dashed",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            marginBottom: 24,
            elevation: 2,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          {image ? (
            <View style={{ width: "100%", height: "100%" }}>
              <Image
                source={{ uri: image }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  padding: 8,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 13 }}>
                  Tap to change
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "#F3F4F6",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Camera color="#4A7C59" size={40} />
              </View>
              <Text
                style={{
                  fontSize: 19,
                  fontWeight: "600",
                  color: "#4A7C59",
                  textAlign: "center",
                }}
              >
                Take a photo of your crop
              </Text>
              <TouchableOpacity onPress={pickImage} style={{ marginTop: 12 }}>
                <Text
                  style={{ color: "#D4832A", fontWeight: "500", fontSize: 16 }}
                >
                  Or upload from gallery
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {/* Language Selector */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#6B7280",
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            SELECT LANGUAGE
          </Text>
          <TouchableOpacity
            onPress={() => setShowLanguagePicker(true)}
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              padding: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 17, color: "#1F2937" }}>
              {selectedLanguage?.label}
            </Text>
            <ChevronDown color="#9CA3AF" size={20} />
          </TouchableOpacity>
        </View>

        {/* Diagnose Button */}
        <TouchableOpacity
          onPress={handleDiagnose}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#4A7C59",
            paddingVertical: 18,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#4A7C59",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
            marginTop: "auto",
            marginBottom: 20,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
            Diagnose
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Analyzing overlay ─────────────────────────────────── */}
      <Modal visible={isAnalyzing} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              paddingVertical: 40,
              paddingHorizontal: 48,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 10,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "#F0FDF4",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <ActivityIndicator size="large" color="#4A7C59" />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1F2937",
                marginBottom: 6,
              }}
            >
              Analyzing your crop...
            </Text>
            <Text
              style={{ fontSize: 14, color: "#9CA3AF", textAlign: "center" }}
            >
              Please wait a moment
            </Text>
          </View>
        </View>
      </Modal>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent={true}
        animationType="slide"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: insets.bottom + 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "bold", color: "#4A7C59" }}
              >
                Select Language
              </Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <X color="#9CA3AF" size={24} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setLanguage(item.value);
                    setShowLanguagePicker(false);
                  }}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 20,
                    backgroundColor:
                      language === item.value ? "#F0FDF4" : "#fff",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      color: language === item.value ? "#4A7C59" : "#1F2937",
                      fontWeight: language === item.value ? "600" : "400",
                    }}
                  >
                    {item.label}
                  </Text>
                  {language === item.value && (
                    <Check color="#4A7C59" size={20} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}