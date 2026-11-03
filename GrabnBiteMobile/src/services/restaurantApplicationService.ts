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

export async function getMyRestaurantApplications(
  token: string,
): Promise<RestaurantApplicationSummary[]> {
  return apiRequest(
    "/api/RestaurantApplication/my-applications",
    {},
    token,
  );
}
