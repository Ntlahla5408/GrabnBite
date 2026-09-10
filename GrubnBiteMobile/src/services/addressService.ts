import { apiRequest } from "./api";

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
  return await apiRequest<Address[]>("/api/Addresses");
};

export const getAddress = async (
  id: number,
): Promise<Address> => {
  return await apiRequest<Address>(`/api/Addresses/${id}`);
};

export const createAddress = async (
  data: CreateAddressRequest,
): Promise<Address> => {
  return await apiRequest<Address>("/api/Addresses", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateAddress = async (
  id: number,
  data: UpdateAddressRequest,
): Promise<Address> => {
  return await apiRequest<Address>(`/api/Addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteAddress = async (
  id: number,
): Promise<void> => {
  await apiRequest<void>(`/api/Addresses/${id}`, {
    method: "DELETE",
  });
};

export const setDefaultAddress = async (
  id: number,
): Promise<Address> => {
  return await apiRequest<Address>(
    `/api/Addresses/${id}/default`,
    {
      method: "PATCH",
    },
  );
};