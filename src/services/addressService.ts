import { apiRequest } from "./api";
import { Address } from "../types/address";

export async function getAddresses(
  token: string
): Promise<Address[]> {
  return apiRequest(
    "/api/Addresses",
    {},
    token
  );
}