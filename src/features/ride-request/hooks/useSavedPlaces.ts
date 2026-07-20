import { useQuery } from "@tanstack/react-query";
import { savedPlacesService } from "@/services/places";

export function useSavedPlaces() {
  return useQuery({
    queryKey: ["saved-places"],
    queryFn: () => savedPlacesService.list(),
  });
}
