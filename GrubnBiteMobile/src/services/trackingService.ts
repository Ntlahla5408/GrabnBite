import {
    HubConnection,
    HubConnectionBuilder,
    LogLevel,
} from "@microsoft/signalr";

let connection: HubConnection | null = null;

const API_URL = "http://YOUR_COMPUTER_IP:5277";

export async function connectToTracking(
  token: string,
  orderId: number,
  onLocationUpdate: (location: any) => void,
  onStatusUpdate: (status: any) => void,
) {
  connection = new HubConnectionBuilder()
    .withUrl(`${API_URL}/hubs/tracking`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();

  connection.on("DriverLocationUpdated", onLocationUpdate);

  connection.on("OrderStatusUpdated", onStatusUpdate);

  await connection.start();

  await connection.invoke("JoinOrderTracking", orderId);

  return connection;
}

export async function disconnectFromTracking(orderId: number) {
  if (!connection) {
    return;
  }

  try {
    await connection.invoke("LeaveOrderTracking", orderId);
  } catch {
    // Connection may already be closed
  }

  await connection.stop();

  connection = null;
}

import * as Location from "expo-location";

export async function startDriverLocationUpdates(
  deliveryId: number,
  token: string,
) {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission was not granted.");
  }

  return await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10,
    },

    async (location) => {
      const latitude = location.coords.latitude;

      const longitude = location.coords.longitude;

      await fetch(
        `http://YOUR_COMPUTER_IP:5277/api/Delivery/${deliveryId}/location`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            latitude,
            longitude,
          }),
        },
      );
    },
  );
}

await connectToTracking(
  token,
  orderId,

  (location) => {
    console.log("Driver moved:", location.latitude, location.longitude);

    // Update map marker here
  },

  (status) => {
    console.log("Order status:", status.status);

    // Update UI here
  },
);
