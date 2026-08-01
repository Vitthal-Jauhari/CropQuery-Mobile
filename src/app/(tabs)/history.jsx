import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, Leaf, ClipboardList } from "lucide-react-native";

// ─── Placeholder data ─────────────────────────────────────────────────────────

const HISTORY = [
  {
    id: "1",
    diseaseName: "Cashew Leaf Miner",
    cropName: "Cashew",
    confidence: 85,
    dateLabel: "Today",
    // Unique green shades for placeholder thumbnails
    thumbColor: "#3D7A50",
    thumbAccent: "#5DA070",
  },
  {
    id: "2",
    diseaseName: "Rice Blast",
    cropName: "Rice",
    confidence: 91,
    dateLabel: "Yesterday",
    thumbColor: "#6B9E5E",
    thumbAccent: "#89BF78",
  },
  {
    id: "3",
    diseaseName: "Tomato Early Blight",
    cropName: "Tomato",
    confidence: 67,
    dateLabel: "3 days ago",
    thumbColor: "#8B7355",
    thumbAccent: "#A8926E",
  },
  {
    id: "4",
    diseaseName: "Wheat Rust",
    cropName: "Wheat",
    confidence: 78,
    dateLabel: "5 days ago",
    thumbColor: "#7A9B5C",
    thumbAccent: "#98C070",
  },
  {
    id: "5",
    diseaseName: "Mango Anthracnose",
    cropName: "Mango",
    confidence: 55,
    dateLabel: "1 week ago",
    thumbColor: "#5C7A45",
    thumbAccent: "#78A05C",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function borderColor(pct) {
  if (pct > 80) return "#4A7C59";
  if (pct >= 60) return "#D4832A";
  return "#EF4444";
}

function badgeBg(pct) {
  if (pct > 80) return "#ECFDF5";
  if (pct >= 60) return "#FFF7ED";
  return "#FEF2F2";
}

function badgeText(pct) {
  if (pct > 80) return "#4A7C59";
  if (pct >= 60) return "#D4832A";
  return "#EF4444";
}

function badgeLabel(pct) {
  if (pct > 80) return "High";
  if (pct >= 60) return "Medium";
  return "Low";
}

// ─── Thumbnail placeholder ────────────────────────────────────────────────────

function CropThumb({ color, accent, size = 72 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        backgroundColor: color,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Simple layered shapes to suggest a crop photo */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: size * 0.38,
          backgroundColor: "rgba(0,0,0,0.18)",
        }}
      />
      <View
        style={{
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: size * 0.21,
          backgroundColor: accent,
          opacity: 0.85,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 8,
          left: 8,
        }}
      >
        <Leaf size={12} color="rgba(255,255,255,0.6)" />
      </View>
    </View>
  );
}

// ─── Diagnosis card ───────────────────────────────────────────────────────────

function DiagnosisCard({ item, onPress }) {
  const pct = item.confidence;
  const border = borderColor(pct);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 16,
        marginBottom: 14,
        overflow: "hidden",
        borderLeftWidth: 5,
        borderLeftColor: border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Thumbnail */}
      <View style={{ padding: 14, paddingRight: 12 }}>
        <CropThumb color={item.thumbColor} accent={item.thumbAccent} />
      </View>

      {/* Info */}
      <View style={{ flex: 1, paddingVertical: 14, paddingRight: 4 }}>
        {/* Disease name */}
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 3,
          }}
          numberOfLines={1}
        >
          {item.diseaseName}
        </Text>

        {/* Crop name */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
            gap: 4,
          }}
        >
          <Leaf size={12} color="#6B7280" />
          <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "500" }}>
            {item.cropName}
          </Text>
        </View>

        {/* Bottom row: date + confidence badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* Date pill */}
          <View
            style={{
              backgroundColor: "#F3F4F6",
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "500" }}>
              {item.dateLabel}
            </Text>
          </View>

          {/* Confidence badge */}
          <View
            style={{
              backgroundColor: badgeBg(pct),
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 3,
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: badgeText(pct),
              }}
            >
              {pct}%
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: badgeText(pct),
                fontWeight: "500",
              }}
            >
              {badgeLabel(pct)}
            </Text>
          </View>
        </View>
      </View>

      {/* Chevron */}
      <View style={{ paddingRight: 14 }}>
        <ChevronRight size={18} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: "#F0FDF4",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <ClipboardList size={40} color="#4A7C59" />
      </View>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color: "#374151",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        No diagnoses yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: "#9CA3AF",
          textAlign: "center",
          lineHeight: 21,
        }}
      >
        Take a photo of your crop on the Diagnose tab to get started.
      </Text>
    </View>
  );
}

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({ entries }) {
  const high = entries.filter((e) => e.confidence > 80).length;
  const medium = entries.filter(
    (e) => e.confidence >= 60 && e.confidence <= 80,
  ).length;
  const low = entries.filter((e) => e.confidence < 60).length;

  const Stat = ({ count, label, color, bg }) => (
    <View style={{ flex: 1, alignItems: "center" }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: bg,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "bold", color }}>{count}</Text>
      </View>
      <Text style={{ fontSize: 11, color: "#6B7280", textAlign: "center" }}>
        {label}
      </Text>
    </View>
  );

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        flexDirection: "row",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Stat count={high} label="High" color="#4A7C59" bg="#ECFDF5" />
      {/* Divider */}
      <View
        style={{ width: 1, backgroundColor: "#F3F4F6", marginVertical: 4 }}
      />
      <Stat count={medium} label="Medium" color="#D4832A" bg="#FFF7ED" />
      <View
        style={{ width: 1, backgroundColor: "#F3F4F6", marginVertical: 4 }}
      />
      <Stat count={low} label="Low" color="#EF4444" bg="#FEF2F2" />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const entries = HISTORY;

  const handleCardPress = (item) => {
    router.push({
      pathname: "/(tabs)/results",
      params: {
        diseaseName: item.diseaseName,
        cropName: item.cropName,
        confidence: item.confidence,
      },
    });
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#FAF8F3", paddingTop: insets.top }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#EBEBEB",
          backgroundColor: "#FAF8F3",
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#4A7C59" }}>
          History
        </Text>
        <Text style={{ fontSize: 14, color: "#9CA3AF", marginTop: 2 }}>
          {entries.length} past{" "}
          {entries.length === 1 ? "diagnosis" : "diagnoses"}
        </Text>
      </View>

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary strip */}
          <SummaryStrip entries={entries} />

          {/* Section label */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#9CA3AF",
              letterSpacing: 0.8,
              marginBottom: 12,
            }}
          >
            RECENT DIAGNOSES
          </Text>

          {/* Cards */}
          {entries.map((item) => (
            <DiagnosisCard
              key={item.id}
              item={item}
              onPress={() => handleCardPress(item)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
