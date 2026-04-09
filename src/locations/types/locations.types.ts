export interface SearchLocationsQuery {
  x: number;
  y: number;
  page?: number;
  limit?: number;
}

export interface LocationSearchItem {
  id: string;
  name: string;
  coordinates: string;
  distance: number;
}

export interface LocationSearchResponse {
  'user-location': string;
  locations: LocationSearchItem[];
  page: number;
  limit: number;
  total: number;
}

export interface LocationDetailsResponse {
  id: string;
  name: string;
  type?: string;
  image?: string;
  coordinates: string;
  'opening-hours'?: string;
}

export interface UpsertLocationRequest {
  id: string;
  name: string;
  type?: string;
  image?: string;
  'opening-hours'?: string;
  coordinates: string;
  radius: number;
}