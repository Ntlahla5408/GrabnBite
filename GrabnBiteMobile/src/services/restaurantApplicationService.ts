import { apiRequest } from "./api";

export interface RestaurantApplicationSummary {
  restaurantApplicationId: number;
  applicationReference: string;
  status: string;
  tradingName: string | null;
  registeredBusinessName: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  documentsRequestedMessage: string | null;
  rejectionReason: string | null;
  hasOperationalRestaurant: boolean;
}

export interface RestaurantApplicationDraft {
  restaurantApplicationId: number;
  applicationReference: string;
  status: string;
  tradingName: string | null;
  registeredBusinessName: string | null;
  cipcRegistrationNumber: string | null;
  restaurantCategory: string | null;
  physicalAddress: string | null;
  city: string | null;
  restaurantContactNumber: string | null;
  businessEmail: string | null;
  websiteOrSocialMediaUrl: string | null;
  representativeFullName: string | null;
  representativePosition: string | null;
  representativeMobileNumber: string | null;
  representativeEmail: string | null;
  hasAuthorityToRepresent: boolean | null;
  offersCustomerCollection: boolean | null;
  offersRestaurantDelivery: boolean | null;
  offersGrubnBiteDelivery: boolean | null;
  averagePreparationTimeMinutes: number | null;
  maximumDeliveryDistanceKm: number | null;
  deliveryInstructions: string | null;
  commissionOfferAccepted: boolean | null;
  submittedAt: string | null;
  documentsRequestedMessage: string | null;
  rejectionReason: string | null;
  adminComments: string | null;
  createdAt: string;
  updatedAt: string;
  operatingHours: {
    dayOfWeek: string;
    isOpen: boolean;
    openingTime: string | null;
    closingTime: string | null;
  }[];
  documents: {
    restaurantDocumentId: number;
    documentType: string;
    documentDescription: string | null;
    originalFileName: string;
    contentType: string;
    fileSize: number;
    verificationStatus: string;
    adminComment: string | null;
    uploadedAt: string;
  }[];
  bankingDetailsProvided: boolean;
}

export type SaveRestaurantApplicationDraft = Pick<
  RestaurantApplicationDraft,
  | "tradingName"
  | "registeredBusinessName"
  | "cipcRegistrationNumber"
  | "restaurantCategory"
  | "physicalAddress"
  | "city"
  | "restaurantContactNumber"
  | "businessEmail"
  | "websiteOrSocialMediaUrl"
  | "representativeFullName"
  | "representativePosition"
  | "representativeMobileNumber"
  | "representativeEmail"
  | "hasAuthorityToRepresent"
  | "offersCustomerCollection"
  | "offersRestaurantDelivery"
  | "offersGrubnBiteDelivery"
  | "averagePreparationTimeMinutes"
  | "maximumDeliveryDistanceKm"
  | "deliveryInstructions"
  | "commissionOfferAccepted"
> & {
  operatingHours: RestaurantApplicationDraft["operatingHours"];
};

export async function getMyRestaurantApplications(
  token: string,
): Promise<RestaurantApplicationSummary[]> {
  return apiRequest("/api/RestaurantApplication/my-applications", {}, token);
}

export async function getRestaurantApplication(
  applicationId: number,
  token: string,
): Promise<RestaurantApplicationDraft> {
  return apiRequest(`/api/RestaurantApplication/${applicationId}`, {}, token);
}

export async function saveRestaurantApplicationDraft(
  applicationId: number,
  draft: SaveRestaurantApplicationDraft,
  token: string,
) {
  return apiRequest(
    `/api/RestaurantApplication/${applicationId}/draft`,
    { method: "PUT", body: JSON.stringify(draft) },
    token,
  );
}

export type RestaurantDocumentType =
  | "CipcCertificate"
  | "FoodPremisesCertificate"
  | "IdentityOrAuthority"
  | "BankConfirmation"
  | "Other";

export async function uploadRestaurantApplicationDocument(
  applicationId: number,
  documentType: RestaurantDocumentType,
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

  return apiRequest(
    `/api/RestaurantApplication/${applicationId}/documents`,
    { method: "POST", body: formData },
    token,
  );
}

export async function getRestaurantApplicationDocumentDownloadUrl(
  applicationId: number,
  documentId: number,
  token: string,
): Promise<{ signedUrl: string; originalFileName: string; contentType: string }> {
  return apiRequest(
    `/api/RestaurantApplication/${applicationId}/documents/${documentId}/download`,
    {},
    token,
  );
}

export async function deleteRestaurantApplicationDocument(
  applicationId: number,
  documentId: number,
  token: string,
) {
  return apiRequest(
    `/api/RestaurantApplication/${applicationId}/documents/${documentId}`,
    { method: "DELETE" },
    token,
  );
}

export interface SaveRestaurantBankingDetails {
  accountHolderName: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  branchCode: string;
  payoutContactEmail: string;
}

export async function saveRestaurantBankingDetails(
  applicationId: number,
  details: SaveRestaurantBankingDetails,
  token: string,
) {
  return apiRequest(
    `/api/RestaurantApplication/${applicationId}/banking-details`,
    { method: "PUT", body: JSON.stringify(details) },
    token,
  );
}

export async function getRestaurantBankingDetails(
  applicationId: number,
  token: string,
) {
  return apiRequest(
    `/api/RestaurantApplication/${applicationId}/banking-details`,
    {},
    token,
  );
}

export async function submitRestaurantApplication(
  applicationId: number,
  token: string,
): Promise<{ restaurantApplicationId: number; applicationReference: string; status: string; message: string; missingItems?: string[] }> {
  return apiRequest(
    `/api/RestaurantApplication/${applicationId}/submit`,
    { method: "POST" },
    token,
  );
}

export async function createRestaurantApplication(
  token: string,
): Promise<{ restaurantApplicationId: number; applicationReference: string; status: string }> {
  return apiRequest(
    "/api/RestaurantApplication",
    { method: "POST" },
    token,
  );
}
