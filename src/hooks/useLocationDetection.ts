import { useQuery } from "@tanstack/react-query";

interface LocationData {
  ip: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  timezone: string;
  org: string;
}

interface LocationError {
  message: string;
}

const fetchLocationData = async (): Promise<LocationData> => {
  const response = await fetch('https://ipinfo.io/json');
  
  if (!response.ok) {
    throw new Error('Failed to fetch location data');
  }
  
  const data = await response.json();
  return {
    ip: data.ip,
    city: data.city || '',
    region: data.region || '',
    country: data.country_name || data.country || '',
    countryCode: data.country || '',
    timezone: data.timezone || '',
    org: data.org || '',
  };
};

export const useLocationDetection = () => {
  const { data, isLoading, error } = useQuery<LocationData, LocationError>({
    queryKey: ['userLocation'],
    queryFn: fetchLocationData,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    location: data,
    isLoading,
    error: error?.message,
    countryCode: data?.countryCode,
    country: data?.country,
  };
};
