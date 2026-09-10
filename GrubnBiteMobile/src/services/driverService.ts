import { apiRequest } from "./api";

export interface Driver {
  id: number;
  userId?: number;
  vehicleType?: string;
  vehicleRegistration?: string;
  isApproved?: boolean;
  isOnline?: boolean;
  createdAt?: string;
}

export interface Delivery {
  id: number;
  orderId?: number;
  driverId?: number;
  status?: string;

  latitude?: number | null;
  longitude?: number | null;

  createdAt?: string;
  updatedAt?: string;

  driver?: Driver;

  order?: {
    id: number;
    status?: string;
    totalAmount?: number;
    total?: number;
  };
}

export interface CreateDriverRequest {
  vehicleType: string;
  vehicleRegistration: string;
}

export interface AssignDriverRequest {
  driverId: number;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
}

/* ---------------- Driver ---------------- */

export const createDriver = async (
  data: CreateDriverRequest,
): Promise<Driver> => {
  return await apiRequest<Driver>("/api/Driver", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const getMyDriver = async (): Promise<Driver> => {
  return await apiRequest<Driver>("/api/Driver/me");
};

export const setDriverOnline = async (): Promise<Driver> => {
  return await apiRequest<Driver>("/api/Driver/online", {
    method: "PUT",
  });
};

export const setDriverOffline = async (): Promise<Driver> => {
  return await apiRequest<Driver>("/api/Driver/offline", {
    method: "PUT",
  });
};

export const approveDriver = async (
  driverId: number,
): Promise<Driver> => {
  return await apiRequest<Driver>(
    `/api/Driver/${driverId}/approve`,
    {
      method: "PUT",
    },
  );
};

/* ---------------- Delivery ---------------- */

export const createDelivery = async (
  orderId: number,
): Promise<Delivery> => {
  return await apiRequest<Delivery>(
    `/api/Delivery/${orderId}`,
    {
      method: "POST",
    },
  );
};

export const getMyDelivery = async (): Promise<Delivery> => {
  return await apiRequest<Delivery>(
    "/api/Delivery/my-delivery",
  );
};

export const assignDriverToDelivery = async (
  deliveryId: number,
  driverId: number,
): Promise<Delivery> => {
  return await apiRequest<Delivery>(
    `/api/Delivery/${deliveryId}/assign`,
    {
      method: "PUT",
      body: JSON.stringify({
        driverId,
      } satisfies AssignDriverRequest),
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

export const updateDeliveryLocation = async (
  deliveryId: number,
  data: UpdateLocationRequest,
): Promise<void> => {
  await apiRequest<void>(
    `/api/Delivery/${deliveryId}/location`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
};

export const getDeliveryLocation = async (
  deliveryId: number,
) => {
  return await apiRequest<{
    latitude: number;
    longitude: number;
    timestamp?: string;
  }>(
    `/api/Delivery/${deliveryId}/location`,
  );
};