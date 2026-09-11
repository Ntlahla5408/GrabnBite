import { router } from "expo-router";
import React, { ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import {
  getCurrentUser,
  getRoleHome,
  normalizeRole,
} from "@/services/sessionService";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export default function RoleGuard({
  allowedRoles,
  children,
}: RoleGuardProps) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login" as any);
      return;
    }

    const userRole = normalizeRole(user.role);

    const roleAllowed = allowedRoles
      .map(normalizeRole)
      .includes(userRole);

    if (!roleAllowed) {
      router.replace(getRoleHome(user.role) as any);
      return;
    }

    setAllowed(true);
    setChecking(false);
  }, [allowedRoles]);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Checking access...</Text>
      </View>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },

  text: {
    marginTop: 10,
    color: "#64748B",
  },
});