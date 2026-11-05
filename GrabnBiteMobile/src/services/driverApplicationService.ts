import { apiRequest } from "./api";

export interface DriverApplicationDocument {
  driverApplicationDocumentId: number;
  documentType: string;
  documentDescription: string | null;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  verificationStatus: string;
  adminComment: string | null;
  uploadedAt: string;
}

export interface DriverApplication {
  driverApplicationId: number;
  applicationReference: string;
  status: string;
  maskedAccountNumber?: string | null;
  documents: DriverApplicationDocument[];
  [key: string]: any;
}

export interface PublishedPolicyDocument {
  policyDocumentId: number;
  title: string;
  description: string;
  fileUrl: string;
  originalFileName: string;
  status: string;
  effectiveDate: string | null;
  version: number;
  audience: "Customer" | "Driver" | "Restaurant" | "All";
}

export async function getPublishedPolicyDocuments(token: string): Promise<PublishedPolicyDocument[]> {
  return apiRequest("/api/Policies", {}, token);
}

export type DriverDocumentType =
  | "IdentityDocument"
  | "ProofOfAddress"
  | "ProfilePhotograph"
  | "DriversLicence"
  | "ProfessionalDrivingPermit"
  | "BusinessRegistration"
  | "VehicleRegistrationCertificate"
  | "VehicleLicence"
  | "RoadworthinessCertificate"
  | "ProofOfInsurance"
  | "ThirdPartyVehiclePermission"
  | "BankConfirmation"
  | "Other";

export async function createDriverApplication(token: string) {
  return apiRequest("/api/DriverApplication", { method: "POST" }, token);
}

export async function getMyDriverApplication(token: string): Promise<DriverApplication> {
  return apiRequest("/api/DriverApplication/me", {}, token);
}

export async function saveDriverApplicationDraft(
  payload: Record<string, unknown>,
  token: string,
) {
  return apiRequest(
    "/api/DriverApplication/draft",
    { method: "PUT", body: JSON.stringify(payload) },
    token,
  );
}

export async function uploadDriverApplicationDocument(
  documentType: DriverDocumentType,
  asset: { uri: string; name: string; mimeType: string },
  token: string,
) {
  const formData = new FormData();

  if (typeof window !== "undefined" && typeof Blob !== "undefined" && !asset.uri.startsWith("file://")) {
    const response = await fetch(asset.uri);
    if (!response.ok) throw new Error("Unable to read the selected document.");
    const blob = await response.blob();
    formData.append("file", new Blob([blob], { type: asset.mimeType }), asset.name);
  } else {
    formData.append("file", {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType,
    } as any);
  }

  formData.append("documentType", documentType);
  return apiRequest("/api/DriverApplication/documents", { method: "POST", body: formData }, token);
}

export async function deleteDriverApplicationDocument(
  documentId: number,
  token: string,
) {
  return apiRequest("/api/DriverApplication/documents/" + documentId, { method: "DELETE" }, token);
}

export async function submitDriverApplication(token: string) {
  return apiRequest("/api/DriverApplication/submit", { method: "POST" }, token);
}
