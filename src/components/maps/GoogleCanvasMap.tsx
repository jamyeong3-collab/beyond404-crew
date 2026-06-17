"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Coordinate = {
  lat: number;
  lng: number;
};

type MapMarker = {
  key: string;
  position: Coordinate;
  label?: string;
  title?: string;
};

type GoogleCanvasMapProps = {
  apiKey: string;
  center: Coordinate;
  zoom: number;
  markers: MapMarker[];
  path?: Coordinate[];
  className?: string;
  fitBounds?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
  onStatusChange?: (status: "loading" | "ready" | "error") => void;
  routeColor?: string;
  routeOpacity?: number;
  routeWeight?: number;
};

type LoaderState =
  | { status: "loading"; error: null }
  | { status: "ready"; error: null }
  | { status: "error"; error: string };

const baseMapOptions: google.maps.MapOptions = {
  clickableIcons: false,
  disableDefaultUI: true,
  gestureHandling: "greedy",
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
};

let googleMapsPromise: Promise<typeof google.maps> | null = null;
let loadedApiKey: string | null = null;

function buildPickupHomeIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="white"/>
      <path d="M14 23.5 24 14l10 9.5" fill="none" stroke="#111827" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M18 24v10.5c0 2 1.3 3.5 3 3.5h6c1.7 0 3-1.5 3-3.5V24" fill="none" stroke="#111827" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  return {
    scaledSize: new window.google.maps.Size(44, 44),
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
  };
}

function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise && loadedApiKey === apiKey) {
    return googleMapsPromise;
  }

  loadedApiKey = apiKey;
  googleMapsPromise = new Promise<typeof google.maps>((resolve, reject) => {
    const callbackName = "__swapitCrewGoogleMapsInit";
    const existingScript = document.getElementById("swapit-crew-google-maps-script") as HTMLScriptElement | null;

    (window as typeof window & { [key: string]: unknown })[callbackName] = () => {
      resolve(window.google.maps);
    };

    if (existingScript) {
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Maps script.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "swapit-crew-google-maps-script";
    script.async = true;
    script.defer = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&language=ko&region=IN&v=weekly&loading=async&callback=${callbackName}`;
    script.onerror = () => reject(new Error("Failed to load Google Maps script."));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function useGoogleMaps(apiKey: string): LoaderState {
  const [state, setState] = useState<LoaderState>({ status: "loading", error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", error: null });

    void loadGoogleMaps(apiKey)
      .then(() => {
        if (!cancelled) {
          setState({ status: "ready", error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            error: error instanceof Error ? error.message : "Failed to load Google Maps.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return state;
}

export function GoogleCanvasMap({
  apiKey,
  center,
  zoom,
  markers,
  path,
  className,
  fitBounds = false,
  onMarkerClick,
  onStatusChange,
  routeColor = "#19c6bf",
  routeOpacity = 0.9,
  routeWeight = 8,
}: GoogleCanvasMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const hasAutoFitRef = useRef(false);
  const { status } = useGoogleMaps(apiKey);

  const stableMarkers = useMemo(() => markers, [markers]);
  const stablePath = useMemo(() => path ?? [], [path]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    if (status !== "ready" || !containerRef.current || mapRef.current) {
      return;
    }

    mapRef.current = new window.google.maps.Map(containerRef.current, {
      ...baseMapOptions,
      center,
      zoom,
    });
  }, [center, status, zoom]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current) {
      return;
    }

    const map = mapRef.current;

    markerRefs.current.forEach((marker) => marker.setMap(null));
    markerRefs.current = stableMarkers.map((marker) => {
      const markerInstance = new window.google.maps.Marker({
        icon: marker.key === "pickup" ? buildPickupHomeIcon() : undefined,
        map,
        position: marker.position,
        title: marker.title,
        label:
          marker.key !== "pickup" && marker.label
            ? {
                text: marker.label,
                color: "#ffffff",
                fontWeight: "900",
              }
            : undefined,
      });

      if (onMarkerClick) {
        markerInstance.addListener("click", () => {
          onMarkerClick(marker);
        });
      }

      return markerInstance;
    });

    if (stablePath.length > 1) {
      if (polylineRef.current) {
        polylineRef.current.setOptions({
          path: stablePath,
          strokeColor: routeColor,
          strokeOpacity: routeOpacity,
          strokeWeight: routeWeight,
        });
        polylineRef.current.setMap(map);
      } else {
        polylineRef.current = new window.google.maps.Polyline({
          map,
          path: stablePath,
          strokeColor: routeColor,
          strokeOpacity: routeOpacity,
          strokeWeight: routeWeight,
        });
      }
    } else if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const points = [...stableMarkers.map((marker) => marker.position), ...stablePath];
    if (fitBounds && points.length > 1 && !hasAutoFitRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      points.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, 48);
      hasAutoFitRef.current = true;
    } else if (!fitBounds && !hasAutoFitRef.current) {
      map.setCenter(center);
      map.setZoom(zoom);
      hasAutoFitRef.current = true;
    }
  }, [center, fitBounds, onMarkerClick, routeColor, routeOpacity, routeWeight, stableMarkers, stablePath, status, zoom]);

  return <div className={className} ref={containerRef} />;
}
