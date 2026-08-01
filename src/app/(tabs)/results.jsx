import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  Thermometer,
  Droplets,
  CloudRain,
  Clock,
  Leaf,
  MessageSquare,
  ShieldAlert,
  Wind,
} from "lucide-react-native";

// ─── Field-mapping helper ─────────────────────────────────────────────────────
// Converts the raw API shape into what the UI components expect.
// Every field is safely defaulted so a partial API response (e.g. weather: null)
// never throws — the Weather / Irrigation tabs just show "N/A" instead.
function parseResult(raw) {
  // Safe-default the weather sub-object so raw.weather.x never throws
  const w = raw.weather || {};

  return {
    diseaseName: raw.disease ?? "Unknown disease",
    scientificName: raw.scientific_name ?? "",
    // API sends 0–1 float; multiply and round → integer percentage
    confidence:
      raw.confidence != null
        ? (raw.confidence > 1
            ? Math.round(raw.confidence)
            : Math.round(raw.confidence * 100))
        : 0,
    severity: raw.severity ?? "Unknown",
    crop: raw.crop ?? "",
    treatment: Array.isArray(raw.treatment) ? raw.treatment : [],
    disclaimer:
      raw.disclaimer ??
      "Consult an agricultural expert before applying any chemicals",
    weather: {
      temperature: w.temp_c ?? "N/A",
      humidity: w.humidity ?? "N/A",       // ← FastAPI sends "humidity"
      rainProbability: w.rain_prob ?? "N/A", // ← FastAPI sends "rain_prob"
      windKmh: w.wind_kmh ?? "N/A",
      sprayAdvice: raw.spray_advice ?? "No spray advice available.",
    },
    irrigation: {
      daysUntilNext: raw.irrigation_days ?? "N/A",
      waterMm: raw.water_mm ?? "N/A",
    },
    faissMatches: raw.faiss_matches ?? 0,
    
    agroBenchScore: raw.agrobench_score ?? "N/A",
  };
}

const TABS = ["Treatment", "Weather", "Irrigation"];

function confidenceColor(pct) {
  if (pct >= 75) return "#4A7C59";
  if (pct >= 50) return "#D4832A";
  return "#EF4444";
}

function confidenceBg(pct) {
  if (pct >= 75) return "#ECFDF5";
  if (pct >= 50) return "#FFF7ED";
  return "#FEF2F2";
}

function TreatmentTab({ diagnosis }) {
  return (
    <View>
      {diagnosis.treatment.map((step, index) => (
        <View
          key={index}
          style={{
            flexDirection: "row",
            marginBottom: 16,
            alignItems: "flex-start",
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "#4A7C59",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
              marginTop: 1,
              flexShrink: 0,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "bold" }}>
              {index + 1}
            </Text>
          </View>
          <Text
            style={{ fontSize: 16, color: "#374151", flex: 1, lineHeight: 25 }}
          >
            {step}
          </Text>
        </View>
      ))}

      {/* Disclaimer — driven by API field */}
      <View
        style={{
          backgroundColor: "#FEF2F2",
          borderRadius: 12,
          padding: 14,
          borderLeftWidth: 4,
          borderLeftColor: "#EF4444",
          marginTop: 4,
          flexDirection: "row",
          alignItems: "flex-start",
        }}
      >
        <AlertTriangle
          size={18}
          color="#EF4444"
          style={{ marginRight: 10, marginTop: 1, flexShrink: 0 }}
        />
        <Text
          style={{ fontSize: 14, color: "#B91C1C", flex: 1, lineHeight: 22 }}
        >
          ⚠️ {diagnosis.disclaimer}
        </Text>
      </View>
    </View>
  );
}

function WeatherTab({ diagnosis }) {
  return (
    <View>
      {/* Four weather stat cards */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            flex: 1,
            minWidth: "40%",
            backgroundColor: "#FFF7ED",
            borderRadius: 14,
            padding: 14,
            alignItems: "center",
          }}
        >
          <Thermometer size={22} color="#D4832A" />
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#1F2937",
              marginTop: 6,
            }}
          >
            {diagnosis.weather.temperature}°C
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
            Temperature
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            minWidth: "40%",
            backgroundColor: "#EFF6FF",
            borderRadius: 14,
            padding: 14,
            alignItems: "center",
          }}
        >
          <Droplets size={22} color="#3B82F6" />
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#1F2937",
              marginTop: 6,
            }}
          >
            {diagnosis.weather.humidity}%
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
            Humidity
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            minWidth: "40%",
            backgroundColor: "#F0F9FF",
            borderRadius: 14,
            padding: 14,
            alignItems: "center",
          }}
        >
          <CloudRain size={22} color="#0EA5E9" />
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#1F2937",
              marginTop: 6,
            }}
          >
            {diagnosis.weather.rainProbability}%
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
            Rain
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            minWidth: "40%",
            backgroundColor: "#F5F3FF",
            borderRadius: 14,
            padding: 14,
            alignItems: "center",
          }}
        >
          <Wind size={22} color="#7C3AED" />
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "#1F2937",
              marginTop: 6,
            }}
          >
            {diagnosis.weather.windKmh} km/h
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
            Wind
          </Text>
        </View>
      </View>

      {/* Spray timing advice — from API field */}
      <View
        style={{
          backgroundColor: "#F0FDF4",
          borderRadius: 14,
          padding: 16,
          borderLeftWidth: 4,
          borderLeftColor: "#4A7C59",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Clock size={16} color="#4A7C59" />
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#4A7C59",
              marginLeft: 6,
            }}
          >
            Spray Timing Advice
          </Text>
        </View>
        <Text style={{ fontSize: 15, color: "#374151", lineHeight: 24 }}>
          {diagnosis.weather.sprayAdvice}
        </Text>
      </View>
    </View>
  );
}

function IrrigationTab({ diagnosis }) {
  return (
    <View>
      {/* Big countdown card */}
      <View
        style={{
          backgroundColor: "#4A7C59",
          borderRadius: 18,
          padding: 28,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Droplets size={32} color="rgba(255,255,255,0.9)" />
        <Text
          style={{
            fontSize: 56,
            fontWeight: "bold",
            color: "#fff",
            marginTop: 8,
            lineHeight: 62,
          }}
        >
          {diagnosis.irrigation.daysUntilNext}
        </Text>
        <Text
          style={{
            fontSize: 17,
            color: "#D1FAE5",
            fontWeight: "600",
            marginTop: 2,
          }}
        >
          Days Until Next Irrigation
        </Text>
      </View>

      {/* Water amount row — from API field water_mm */}
      <View
        style={{
          backgroundColor: "#EFF6FF",
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "#BFDBFE",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 14,
          }}
        >
          <Droplets size={20} color="#3B82F6" />
        </View>
        <View>
          <Text
            style={{
              fontSize: 11,
              color: "#6B7280",
              fontWeight: "700",
              letterSpacing: 0.5,
            }}
          >
            RECOMMENDED WATER AMOUNT
          </Text>
          <Text
            style={{
              fontSize: 18,
              color: "#1F2937",
              fontWeight: "bold",
              marginTop: 3,
            }}
          >
            {diagnosis.irrigation.waterMm} mm per irrigation
          </Text>
        </View>
      </View>

      {/* Advisory note */}
      <View
        style={{
          backgroundColor: "#FFF7ED",
          borderRadius: 14,
          padding: 16,
          borderLeftWidth: 4,
          borderLeftColor: "#D4832A",
        }}
      >
        <Text style={{ fontSize: 15, color: "#92400E", lineHeight: 24 }}>
          Avoid over-watering — excess moisture encourages fungal growth and can
          worsen leaf miner damage. Stick to scheduled irrigation cycles.
        </Text>
      </View>
    </View>
  );
}

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("Treatment");

  const image = params.image || null;

  // Parse the JSON result param; fall back gracefully if missing
  const diagnosis = useMemo(() => {
    try {
      const raw = JSON.parse(params.result);
      return parseResult(raw);
    } catch {
      return null;
    }
  }, [params.result]);

  if (!diagnosis) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FAF8F3",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: insets.top,
        }}
      >
        <Leaf size={48} color="#D1D5DB" />
        <Text style={{ fontSize: 16, color: "#9CA3AF", marginTop: 12 }}>
          No diagnosis data. Please run Diagnose first.
        </Text>
      </View>
    );
  }

  const pct = diagnosis.confidence;

  return (
    <View
      style={{ flex: 1, backgroundColor: "#FAF8F3", paddingTop: insets.top }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen title + AgroBench badge — value from API */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#4A7C59" }}>
            Diagnosis Results
          </Text>
          <View
            style={{
              backgroundColor: "#F3F4F6",
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "600" }}>
              AgroBench: {diagnosis.agroBenchScore}%
            </Text>
          </View>
        </View>

        {/* Photo + disease summary card */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          {/* Thumbnail */}
          {image ? (
            <Image
              source={{ uri: image }}
              style={{ width: "100%", height: 170 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: 170,
                backgroundColor: "#F3F4F6",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Leaf size={40} color="#D1D5DB" />
              <Text style={{ color: "#9CA3AF", marginTop: 8, fontSize: 15 }}>
                Crop photo
              </Text>
            </View>
          )}

          {/* Disease info */}
          <View style={{ padding: 18 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text
                  style={{
                    fontSize: 21,
                    fontWeight: "bold",
                    color: "#111827",
                    lineHeight: 27,
                  }}
                >
                  {diagnosis.diseaseName}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#9CA3AF",
                    fontStyle: "italic",
                    marginTop: 3,
                  }}
                >
                  {diagnosis.scientificName}
                </Text>
              </View>

              {/* Confidence badge + FAISS line — both from API */}
              <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
                <View
                  style={{
                    backgroundColor: confidenceBg(pct),
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: confidenceColor(pct),
                    }}
                  >
                    {pct}% confident
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    color: "#9CA3AF",
                    marginTop: 5,
                    textAlign: "right",
                  }}
                >
                  FAISS: {diagnosis.faissMatches} similar cases found
                </Text>
              </View>
            </View>

            {/* Severity + crop */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ShieldAlert size={14} color="#D4832A" />
                <Text
                  style={{
                    fontSize: 14,
                    color: "#D4832A",
                    fontWeight: "600",
                    marginLeft: 5,
                  }}
                >
                  Severity: {diagnosis.severity}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Leaf size={13} color="#6B7280" />
                <Text style={{ fontSize: 14, color: "#6B7280", marginLeft: 4 }}>
                  {diagnosis.crop}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabbed advisory section */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          {/* Tab bar */}
          <View
            style={{
              flexDirection: "row",
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    alignItems: "center",
                    borderBottomWidth: 2.5,
                    borderBottomColor: isActive ? "#4A7C59" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: isActive ? "700" : "500",
                      color: isActive ? "#4A7C59" : "#9CA3AF",
                    }}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ padding: 18 }}>
            {activeTab === "Treatment" && (
              <TreatmentTab diagnosis={diagnosis} />
            )}
            {activeTab === "Weather" && <WeatherTab diagnosis={diagnosis} />}
            {activeTab === "Irrigation" && (
              <IrrigationTab diagnosis={diagnosis} />
            )}
          </View>
        </View>

        {/* Ask follow-up CTA */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(tabs)/ask",
              params: { diseaseName: diagnosis.diseaseName },
            })
          }
          activeOpacity={0.85}
          style={{
            backgroundColor: "#D4832A",
            paddingVertical: 18,
            borderRadius: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            shadowColor: "#D4832A",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <MessageSquare size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
            Ask a follow-up question
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
