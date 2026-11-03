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
