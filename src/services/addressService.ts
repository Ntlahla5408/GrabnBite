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

export async function getAddresses(): Promise<Address[]> {
  return apiRequest("/api/Addresses", {
    method: "GET",
  });
}

export async function getAddress(id: number): Promise<Address> {
  return apiRequest(`/api/Addresses/${id}`, {
    method: "GET",
  });
}

export async function createAddress(
  address: CreateAddressRequest,
): Promise<Address> {
  return apiRequest("/api/Addresses", {
    method: "POST",
    body: JSON.stringify(address),
  });
}

export async function updateAddress(
  id: number,
  address: UpdateAddressRequest,
): Promise<Address> {
  return apiRequest(`/api/Addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(address),
  });
}

export async function deleteAddress(id: number): Promise<void> {
  await apiRequest(`/api/Addresses/${id}`, {
    method: "DELETE",
  });
}

export async function setDefaultAddress(id: number): Promise<void> {
  await apiRequest(`/api/Addresses/${id}/default`, {
    method: "PATCH",
  });
}
