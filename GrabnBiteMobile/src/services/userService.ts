import { User } from "../types/auth";
import { apiRequest, createImageFormData } from "./api";

export interface UpdateMyProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export async function getMyProfile(token: string): Promise<User> {
  return apiRequest("/api/Users/me", {}, token);
}

export async function updateMyProfile(
  userId: number,
  profile: UpdateMyProfileRequest,
  token: string,
): Promise<User> {
  return apiRequest(
    `/api/Users/${userId}`,
    { method: "PUT", body: JSON.stringify(profile) },
    token,
  );
}

export async function changeMyPassword(
  currentPassword: string,
  newPassword: string,
  token: string,
): Promise<{ message: string }> {
  return apiRequest(
    "/api/Users/me/password",
    {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    },
    token,
  );
}

export async function requestEmailChange(
  currentPassword: string,
  newEmail: string,
  token: string,
): Promise<{ message: string; targetEmail: string; expiresInMinutes: number }> {
  return apiRequest(
    "/api/Users/me/request-email-change",
    {
      method: "POST",
      body: JSON.stringify({ currentPassword, newEmail }),
    },
    token,
  );
}

export async function verifyEmailChange(
  code: string,
  token: string,
): Promise<{ message: string; user: User }> {
  return apiRequest(
    "/api/Users/me/verify-email-change",
    { method: "POST", body: JSON.stringify({ code }) },
    token,
  );
}

export interface ProfileImageAsset {
  uri: string;
  name: string;
  type: string;
}

export async function uploadMyProfilePhoto(
  asset: ProfileImageAsset,
  token: string,
): Promise<{ profileImageUrl: string }> {
  const formData = await createImageFormData(asset);
  return apiRequest(
    "/api/Users/me/profile-photo",
    { method: "POST", body: formData },
    token,
  );
}

export async function deleteMyProfilePhoto(
  token: string,
): Promise<{ message: string }> {
  return apiRequest("/api/Users/me/profile-photo", { method: "DELETE" }, token);
}
