import { apiRequest } from "./api";

export interface Address {
  addressId: number;
  label: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface CreateAddressRequest {
  label: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface UpdateAddressRequest {
  label: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export async function getAddresses(token: string): Promise<Address[]> {
  return apiRequest(
    "/api/Addresses",
    {
      method: "GET",
    },
    token,
  );
}

export async function getAddress(id: number, token: string): Promise<Address> {
  return apiRequest(
    `/api/Addresses/${id}`,
    {
      method: "GET",
    },
    token,
  );
}

export async function createAddress(
  address: CreateAddressRequest,
  token: string,
): Promise<Address> {
  return apiRequest(
    "/api/Addresses",
    {
      method: "POST",
      body: JSON.stringify(address),
    },
    token,
  );
}

export async function updateAddress(
  id: number,
  address: UpdateAddressRequest,
  token: string,
): Promise<Address> {
  return apiRequest(
    `/api/Addresses/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(address),
    },
    token,
  );
}

export async function deleteAddress(id: number, token: string): Promise<void> {
  await apiRequest(
    `/api/Addresses/${id}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export async function setDefaultAddress(
  id: number,
  token: string,
): Promise<void> {
  await apiRequest(
    `/api/Addresses/${id}/default`,
    {
      method: "PATCH",
    },
    token,
  );
}
