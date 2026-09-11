import { apiRequest } from "./api";

export interface Delivery {
  id: number;
  orderId?: number;
  driverId?: number;

  status?: string;

  latitude?: number | null;
  longitude?: number | null;

  createdAt?: string;
  updatedAt?: string;

  driver?: {
    id: number;
    vehicleType?: string;
    vehicleRegistration?: string;
  };
}

export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  timestamp?: string;
}

export interface UpdateDeliveryLocationRequest {
  latitude: number;
  longitude: number;
}

export const createDelivery = async (
  orderId: number,
): Promise<Delivery> => {
  return await apiRequest<Delivery>(`/api/Delivery/${orderId}`, {
    method: "POST",
  });
};

export const getMyDelivery = async (): Promise<Delivery> => {
  return await apiRequest<Delivery>("/api/Delivery/my-delivery");
};

export const getDeliveryLocation = async (
  deliveryId: number,
): Promise<DeliveryLocation> => {
  return await apiRequest<DeliveryLocation>(
    `/api/Delivery/${deliveryId}/location`,
  );
};

export const updateDeliveryLocation = async (
  deliveryId: number,
  data: UpdateDeliveryLocationRequest,
): Promise<void> => {
  await apiRequest<void>(`/api/Delivery/${deliveryId}/location`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const assignDriver = async (
  deliveryId: number,
  driverId: number,
): Promise<Delivery> => {
  return await apiRequest<Delivery>(
    `/api/Delivery/${deliveryId}/assign`,
    {
      method: "PUT",
      body: JSON.stringify({ driverId }),
    },
  );
};

export const pickupDelivery = async (
  deliveryId: number,
): Promise<Delivery> => {
  return await apiRequest<Delivery>(
    `/api/Delivery/${deliveryId}/pickup`,
    {
      method: "PUT",
    },
  );
};

export const startDelivery = async (
  deliveryId: number,
): Promise<Delivery> => {
  return await apiRequest<Delivery>(
    `/api/Delivery/${deliveryId}/start`,
    {
      method: "PUT",
    },
  );
};

export const completeDelivery = async (
  deliveryId: number,
): Promise<Delivery> => {
  return await apiRequest<Delivery>(
    `/api/Delivery/${deliveryId}/complete`,
    {
      method: "PUT",
    },
  );
};