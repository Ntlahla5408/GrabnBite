import { apiRequest } from "./api";
import { getCurrentUser } from "./sessionService";

export interface Address {
  id: number;
  label: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

interface AddressResponse {
  addressId?: number;
  id?: number;
  label: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

const getUserId = (): number => {
  const userId = getCurrentUser()?.userId;

  if (!userId) {
    throw new Error("Please sign in before managing addresses.");
  }

  return userId;
};

const normalizeAddress = (address: AddressResponse): Address => ({
  id: Number(address.addressId ?? address.id ?? 0),
  label: address.label,
  streetAddress: address.streetAddress,
  city: address.city,
  province: address.province,
  postalCode: address.postalCode,
  latitude: address.latitude ?? null,
  longitude: address.longitude ?? null,
  isDefault: address.isDefault,
});

export interface CreateAddressRequest {
  label: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

export interface UpdateAddressRequest {
  label: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
}

export const getAddresses = async (): Promise<Address[]> => {
  const userId = getUserId();
  const addresses = await apiRequest<AddressResponse[]>(
    `/api/Addresses/${userId}`,
  );
  return addresses.map(normalizeAddress);
};

export const getAddress = async (id: number): Promise<Address> => {
  const userId = getUserId();
  const address = await apiRequest<AddressResponse>(
    `/api/Addresses/${userId}/${id}`,
  );
  return normalizeAddress(address);
};

export const createAddress = async (
  data: CreateAddressRequest,
): Promise<Address> => {
  const userId = getUserId();
  const address = await apiRequest<AddressResponse>(
    `/api/Addresses/${userId}`,
    {
      method: "POST",
      body: JSON.stringify({
        ...data,
        latitude: data.latitude ?? 0,
        longitude: data.longitude ?? 0,
      }),
    },
  );
  return normalizeAddress(address);
};

export const updateAddress = async (
  id: number,
  data: UpdateAddressRequest,
): Promise<Address> => {
  const userId = getUserId();
  const address = await apiRequest<AddressResponse>(
    `/api/Addresses/${userId}/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        ...data,
        latitude: data.latitude ?? 0,
        longitude: data.longitude ?? 0,
      }),
    },
  );
  return normalizeAddress(address);
};

export const deleteAddress = async (id: number): Promise<void> => {
  const userId = getUserId();
  await apiRequest<void>(`/api/Addresses/${userId}/${id}`, {
    method: "DELETE",
  });
};

export const setDefaultAddress = async (id: number): Promise<Address> => {
  const userId = getUserId();
  const address = await apiRequest<AddressResponse>(
    `/api/Addresses/${userId}/${id}/default`,
    {
      method: "PATCH",
    },
  );
  return normalizeAddress(address);
};
