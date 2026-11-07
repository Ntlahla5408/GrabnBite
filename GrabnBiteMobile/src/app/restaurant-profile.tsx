import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../context/authContext";
import { useErrorFeedback } from "../context/ErrorFeedbackContext";
import { getUserFacingError, logAppError } from "../services/errorHandler";
import {
  getMyRestaurantApplications,
  createRestaurantApplication,
  RestaurantApplicationSummary,
} from "../services/restaurantApplicationService";

export default function RestaurantProfileScreen() {
  const { user, token, loading: authLoading } = useAuth();
  const { showError } = useErrorFeedback();
  const [applications, setApplications] = useState<RestaurantApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingApplication, setCreatingApplication] = useState(false);
  const [error, setError] = useState("");

  const loadApplications = useCallback(async () => {
    if (!token) return;

    try {
      const results = await getMyRestaurantApplications(token);
      setError("");
      setApplications(results);
    } catch (requestError: any) {
      logAppError("Loading restaurant partner applications", requestError);
      showError(getUserFacingError(requestError, {
        title: "We couldn't load your applications",
        message: "Your restaurant partner applications are temporarily unavailable. Please try again.",
        actionLabel: "Try again",
      }), () => { setLoading(true); void loadApplications(); });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, showError]);

  useEffect(() => {
    if (authLoading) return;

    if (user?.role !== "Restaurant") {
      router.replace("/");
      return;
    }

    if (!token) return;

    let active = true;

    const fetchApplications = async () => {
      try {
        const results = await getMyRestaurantApplications(token);
        if (!active) return;
        setError("");
        setApplications(results);
      } catch (requestError: any) {
        if (active) {
          logAppError("Loading restaurant partner applications", requestError);
          showError(getUserFacingError(requestError, {
            title: "We couldn't load your applications",
            message: "Your restaurant partner applications are temporarily unavailable. Please try again.",
            actionLabel: "Try again",
          }), () => { setLoading(true); void loadApplications(); });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchApplications();

    return () => {
      active = false;
    };
  }, [authLoading, token, user?.role, showError, loadApplications]);

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.muted}>Loading your partner applications...</Text>
      </View>
    );
  }

  if (!token || user?.role !== "Restaurant") return null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/restaurant-dashboard")}>
          <Text style={styles.backText}>‹  Dashboard</Text>
        </Pressable>
        <Text style={styles.title}>Restaurant partner applications</Text>
        <Text style={styles.subtitle}>
          Applications are saved against your account. You can have more than one restaurant application.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadApplications();
            }}
          />
        }
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.newApplicationButton, creatingApplication && styles.disabled]}
          disabled={creatingApplication}
          onPress={async () => {
            if (!token) return;
            try {
              setCreatingApplication(true);
              setError("");
              const created = await createRestaurantApplication(token);
              router.push(
                `/restaurant-application-edit?applicationId=${created.restaurantApplicationId}` as any,
              );
            } catch (createError: any) {
              logAppError("Creating a restaurant partner application", createError);
              showError(getUserFacingError(createError, {
                title: "We couldn't start another application",
                message: "A new restaurant application has not been created. Please try again.",
              }));
            } finally {
              setCreatingApplication(false);
            }
          }}
        >
          {creatingApplication
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.newApplicationButtonText}>+ Start another restaurant application</Text>}
        </Pressable>

        {applications.length === 0 && !error ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No application found</Text>
            <Text style={styles.body}>
              Your restaurant account does not currently have a partner application. If you registered as a restaurant partner recently, refresh this screen.
            </Text>
          </View>
        ) : null}

        {applications.map((application) => (
          <View key={application.restaurantApplicationId} style={styles.card}>
            <Text style={styles.cardTitle}>
              {application.tradingName ||
                application.registeredBusinessName ||
                "New restaurant application"}
            </Text>
            <Text style={styles.reference}>
              Reference: {application.applicationReference}
            </Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{formatStatus(application.status)}</Text>
            </View>
            {application.documentsRequestedMessage ? (
              <Text style={styles.notice}>
                Documents requested: {application.documentsRequestedMessage}
              </Text>
            ) : null}
            {application.rejectionReason ? (
              <Text style={styles.error}>{application.rejectionReason}</Text>
            ) : null}
            <Text style={styles.body}>
              {application.status === "Draft"
                ? "Your draft has been saved. The application details and supporting documents still need to be completed before submission."
                : application.status === "PendingReview"
                  ? "Your application has been submitted and is awaiting administrator review."
                  : application.status === "DocumentsRequired"
                    ? "The administrator has requested additional documents. Review the request before resubmitting."
                    : application.status === "UnderVerification"
                      ? "Your submitted information and documents are being verified."
                      : application.status === "Approved"
                        ? application.hasOperationalRestaurant
                          ? "Your application has been approved and your operational restaurant profile is active. You can return to the dashboard to manage it."
                          : "Your application has been approved, but its operational restaurant profile is not active yet. It will become available once activation is completed."
                        : "This application was rejected. Review the administrator's feedback or contact support."}
            </Text>
            <Text style={styles.date}>
              Last updated: {new Date(application.updatedAt).toLocaleDateString()}
            </Text>
            {application.status === "Draft" || application.status === "DocumentsRequired" ? (
              <Pressable
                style={styles.editButton}
                onPress={() =>
                  router.push(
                    `/restaurant-application-edit?applicationId=${application.restaurantApplicationId}` as any,
                  )
                }
              >
                <Text style={styles.editButtonText}>
                  {application.status === "Draft" ? "Continue application" : "Update application"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ))}

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace("/restaurant-dashboard")}
        >
          <Text style={styles.secondaryButtonText}>Back to dashboard</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function formatStatus(status: string) {
  return status.replace(/([a-z])([A-Z])/g, "$1 $2");
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#071B2C", paddingHorizontal: 22, paddingTop: 54, paddingBottom: 24 },
  backText: { color: "#FDBA74", fontSize: 14, fontWeight: "700", marginBottom: 18 },
  title: { color: "#FFFFFF", fontSize: 25, fontWeight: "800" },
  subtitle: { color: "#CBD5E1", fontSize: 14, lineHeight: 20, marginTop: 7 },
  content: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 20, paddingBottom: 50 },
  newApplicationButton: { minHeight: 48, borderRadius: 10, backgroundColor: "#F97316", alignItems: "center", justifyContent: "center", paddingHorizontal: 14, marginBottom: 16 },
  newApplicationButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, padding: 18, marginBottom: 14 },
  cardTitle: { color: "#071B2C", fontSize: 18, fontWeight: "800" },
  reference: { color: "#64748B", fontSize: 12, marginTop: 6 },
  statusPill: { alignSelf: "flex-start", backgroundColor: "#FFF7ED", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginTop: 12 },
  statusText: { color: "#9A3412", fontWeight: "800", fontSize: 12 },
  body: { color: "#475569", fontSize: 14, lineHeight: 21, marginTop: 12 },
  notice: { color: "#9A3412", backgroundColor: "#FFF7ED", padding: 10, borderRadius: 8, marginTop: 12, lineHeight: 19 },
  date: { color: "#94A3B8", fontSize: 12, marginTop: 12 },
  error: { color: "#B91C1C", backgroundColor: "#FEE2E2", borderRadius: 9, padding: 12, marginBottom: 14 },
  secondaryButton: { minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginTop: 8 },
  editButton: { minHeight: 44, borderRadius: 9, backgroundColor: "#F97316", alignItems: "center", justifyContent: "center", marginTop: 16 },
  editButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  secondaryButtonText: { color: "#334155", fontSize: 14, fontWeight: "700" },
  center: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", padding: 24 },
  muted: { color: "#64748B", textAlign: "center", lineHeight: 20, marginTop: 12 },
});
