import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Edit2,
  MapPin,
  Layers,
  Check,
  X,
  Sprout,
  Loader2,
  Navigation,
  Satellite,
  Map as MapIcon,
  ExternalLink,
  Trash2,
  Pentagon,
  RotateCcw,
} from 'lucide-react';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useApp } from '../context/AppContext';

/* =========================================================
   TYPES
========================================================= */

type BoundaryPoint = {
  lat: number;
  lng: number;
};

type FarmWithBoundary = {
  id?: string;
  name?: string;
  locationName?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  areaAcres?: number;
  primaryCrop?: string;
  soilType?: string;
  irrigationMethod?: string;

  // New real farm boundary
  boundary?: BoundaryPoint[];
};

/* =========================================================
   LEAFLET ICON FIX
========================================================= */

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* =========================================================
   AREA CALCULATION
   Returns acres from polygon coordinates
========================================================= */

const calculatePolygonAreaAcres = (
  points: BoundaryPoint[]
): number => {
  if (points.length < 3) return 0;

  const earthRadiusMeters = 6378137;

  const lat0 =
    (points.reduce((sum, point) => sum + point.lat, 0) /
      points.length) *
    (Math.PI / 180);

  const projected = points.map((point) => {
    const lat = point.lat * (Math.PI / 180);
    const lng = point.lng * (Math.PI / 180);

    return {
      x: earthRadiusMeters * lng * Math.cos(lat0),
      y: earthRadiusMeters * lat,
    };
  });

  let area = 0;

  for (let i = 0; i < projected.length; i++) {
    const j = (i + 1) % projected.length;

    area +=
      projected[i].x * projected[j].y -
      projected[j].x * projected[i].y;
  }

  const areaSqMeters = Math.abs(area) / 2;

  const acres = areaSqMeters / 4046.8564224;

  return Number(acres.toFixed(2));
};

/* =========================================================
   MAP CENTER COMPONENT
========================================================= */

const MapCenterController: React.FC<{
  latitude: number;
  longitude: number;
}> = ({ latitude, longitude }) => {
  const map = useMap();

  useEffect(() => {
    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      map.setView([latitude, longitude], 17);
    }
  }, [latitude, longitude, map]);

  return null;
};

/* =========================================================
   MAP CLICK HANDLER
========================================================= */

const BoundaryDrawingLayer: React.FC<{
  drawing: boolean;
  onAddPoint: (point: BoundaryPoint) => void;
}> = ({ drawing, onAddPoint }) => {
  useMapEvents({
    click(event) {
      if (!drawing) return;

      onAddPoint({
        lat: Number(event.latlng.lat.toFixed(7)),
        lng: Number(event.latlng.lng.toFixed(7)),
      });
    },
  });

  return null;
};

/* =========================================================
   MAIN PAGE
========================================================= */

export const MyFarmPage: React.FC = () => {
  const { t, farm, createFarm, updateFarmData } = useApp();

  const currentFarm = farm as FarmWithBoundary | null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [isDetectingLocation, setIsDetectingLocation] =
    useState(false);

  const [locationPermissionPrompt, setLocationPermissionPrompt] =
    useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isSatellite, setIsSatellite] = useState(true);

  const [isDrawingBoundary, setIsDrawingBoundary] =
    useState(false);

  const [boundaryPoints, setBoundaryPoints] = useState<
    BoundaryPoint[]
  >([]);

  const [isSavingBoundary, setIsSavingBoundary] =
    useState(false);

  const [mapKey, setMapKey] = useState(0);

  /* =========================================================
     FORM
  ========================================================= */

  const initialFormState = {
    name: '',
    locationName: '',
    state: '',
    country: '',
    latitude: 0,
    longitude: 0,
    areaAcres: 0,
    primaryCrop: '',
    soilType: 'Loamy',
    irrigationMethod: 'Drip',
  };

  const [formData, setFormData] =
    useState(initialFormState);

  /* =========================================================
     LOAD SAVED BOUNDARY
  ========================================================= */

  useEffect(() => {
    if (!currentFarm) {
      setBoundaryPoints([]);
      return;
    }

    const serverBoundary =
      Array.isArray(currentFarm.boundary)
        ? currentFarm.boundary
        : [];

    if (serverBoundary.length >= 3) {
      setBoundaryPoints(serverBoundary);
      return;
    }

    /*
      Fallback for existing demo/local data.
      This also protects the boundary during development
      if backend schema has not yet been migrated.
    */
    try {
      const localData =
        localStorage.getItem('agrin_farm_boundary');

      if (localData) {
        const parsed = JSON.parse(localData);

        if (
          Array.isArray(parsed) &&
          parsed.length >= 3
        ) {
          setBoundaryPoints(parsed);
        }
      }
    } catch {
      setBoundaryPoints([]);
    }
  }, [currentFarm]);

  /* =========================================================
     OPEN CREATE
  ========================================================= */

  const handleOpenCreate = () => {
    setIsCreating(true);
    setFormData(initialFormState);
    setBoundaryPoints([]);
    setFormError(null);
    setLocationPermissionPrompt(false);
    setIsModalOpen(true);
  };

  /* =========================================================
     OPEN EDIT
  ========================================================= */

  const handleOpenEdit = () => {
    if (!currentFarm) {
      handleOpenCreate();
      return;
    }

    setIsCreating(false);

    setFormData({
      name: currentFarm.name || '',
      locationName: currentFarm.locationName || '',
      state: currentFarm.state || '',
      country: currentFarm.country || '',
      latitude: currentFarm.latitude || 0,
      longitude: currentFarm.longitude || 0,
      areaAcres: currentFarm.areaAcres || 0,
      primaryCrop: currentFarm.primaryCrop || '',
      soilType: currentFarm.soilType || 'Loamy',
      irrigationMethod:
        currentFarm.irrigationMethod || 'Drip',
    });

    setFormError(null);
    setLocationPermissionPrompt(false);
    setIsModalOpen(true);
  };

  /* =========================================================
     BROWSER LOCATION
  ========================================================= */

  const requestBrowserGeolocation = () => {
    if (!navigator.geolocation) {
      setFormError(
        'Geolocation is not supported by your browser.'
      );
      return;
    }

    setIsDetectingLocation(true);
    setFormError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(
          pos.coords.latitude.toFixed(7)
        );

        const lon = Number(
          pos.coords.longitude.toFixed(7)
        );

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
          locationName:
            prev.locationName ||
            `${lat}° N, ${lon}° E`,
        }));

        setIsDetectingLocation(false);
        setLocationPermissionPrompt(false);
      },

      (err) => {
        setIsDetectingLocation(false);
        setLocationPermissionPrompt(false);

        if (
          err.code ===
          err.PERMISSION_DENIED
        ) {
          setFormError(
            'Location permission was denied. You can manually enter coordinates.'
          );
        } else {
          setFormError(
            'Unable to detect location. Please enter coordinates manually.'
          );
        }
      },

      {
        timeout: 10000,
        enableHighAccuracy: true,
      }
    );
  };

  /* =========================================================
     CREATE / UPDATE FARM
  ========================================================= */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFormError('Farm name is required.');
      return;
    }

    if (
      !Number.isFinite(formData.latitude) ||
      !Number.isFinite(formData.longitude) ||
      formData.latitude === 0 ||
      formData.longitude === 0
    ) {
      setFormError(
        'Please add valid farm coordinates.'
      );
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload: any = {
        ...formData,

        /*
          Save the currently drawn boundary with farm.
        */
        boundary:
          boundaryPoints.length >= 3
            ? boundaryPoints
            : currentFarm?.boundary || [],
      };

      /*
        If boundary exists, calculated area becomes
        the farm's real area.
      */
      if (boundaryPoints.length >= 3) {
        payload.areaAcres =
          calculatePolygonAreaAcres(
            boundaryPoints
          );
      }

      if (isCreating || !currentFarm) {
        const result =
          await createFarm(payload);

        if (!result.success) {
          setFormError(
            result.message ||
              'Failed to create farm.'
          );

          setIsSubmitting(false);
          return;
        }
      } else {
        await updateFarmData(payload);
      }

      /*
        Local fallback persistence.
      */
      if (boundaryPoints.length >= 3) {
        localStorage.setItem(
          'agrin_farm_boundary',
          JSON.stringify(boundaryPoints)
        );
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(
        err?.message ||
          'Failed to save farm details.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     DRAWING
  ========================================================= */

  const startDrawingBoundary = () => {
    if (
      !currentFarm?.latitude ||
      !currentFarm?.longitude
    ) {
      setFormError(
        'Farm coordinates are required before drawing a boundary.'
      );
      return;
    }

    setFormError(null);
    setBoundaryPoints([]);
    setIsDrawingBoundary(true);
  };

  const undoLastPoint = () => {
    setBoundaryPoints((prev) =>
      prev.slice(0, -1)
    );
  };

  const clearBoundary = () => {
    setBoundaryPoints([]);
  };

  /* =========================================================
     SAVE BOUNDARY
  ========================================================= */

  const saveBoundary = async () => {
    if (
      boundaryPoints.length < 3
    ) {
      setFormError(
        'Please select at least 3 points to create the farm boundary.'
      );
      return;
    }

    if (!currentFarm) return;

    setIsSavingBoundary(true);
    setFormError(null);

    try {
      const calculatedArea =
        calculatePolygonAreaAcres(
          boundaryPoints
        );

      /*
        IMPORTANT:
        updateFarmData already sends updates to
        PUT /api/farms/me.
      */
      await updateFarmData({
        boundary:
          boundaryPoints,
        areaAcres:
          calculatedArea,
      } as any);

      /*
        Local fallback.
      */
      localStorage.setItem(
        'agrin_farm_boundary',
        JSON.stringify(boundaryPoints)
      );

      setIsDrawingBoundary(false);

      /*
        Force Leaflet to rebuild cleanly.
      */
      setMapKey((prev) => prev + 1);
    } catch (error: any) {
      setFormError(
        error?.message ||
          'Unable to save farm boundary.'
      );
    } finally {
      setIsSavingBoundary(false);
    }
  };

  /* =========================================================
     REMOVE SAVED BOUNDARY
  ========================================================= */

  const removeBoundary = async () => {
    if (!currentFarm) return;

    const confirmed =
      window.confirm(
        'Remove the saved farm boundary?'
      );

    if (!confirmed) return;

    setIsSavingBoundary(true);

    try {
      await updateFarmData({
        boundary: [],
        areaAcres: 0,
      } as any);

      setBoundaryPoints([]);

      localStorage.removeItem(
        'agrin_farm_boundary'
      );

      setIsDrawingBoundary(false);

      setMapKey((prev) => prev + 1);
    } catch (error: any) {
      setFormError(
        error?.message ||
          'Unable to remove boundary.'
      );
    } finally {
      setIsSavingBoundary(false);
    }
  };

  /* =========================================================
     CALCULATED AREA
  ========================================================= */

  const calculatedBoundaryArea =
    useMemo(() => {
      return calculatePolygonAreaAcres(
        boundaryPoints
      );
    }, [boundaryPoints]);

  /* =========================================================
     MAP URL
  ========================================================= */

  const googleMapsUrl =
    currentFarm?.latitude &&
    currentFarm?.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${currentFarm.latitude},${currentFarm.longitude}`
      : '';

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e]">
            {t('farm.title')}
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {t('farm.subtitle')}
          </p>
        </div>

        {currentFarm && (
          <button
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#156637] hover:bg-[#104e2a] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all self-start sm:self-auto cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            <span>{t('farm.edit')}</span>
          </button>
        )}
      </div>

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {!currentFarm && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#e8ece8] shadow-card text-center flex flex-col items-center justify-center space-y-5">

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#f2f6f2] border border-agri-200/60 flex items-center justify-center text-agri-700 shadow-inner">
            <Sprout className="w-8 h-8 sm:w-10 sm:h-10 text-[#156637]" />
          </div>

          <div className="max-w-md space-y-2">

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Add your farm to unlock personalized insights.
            </h2>

            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Configure your actual farm coordinates,
              crop type, soil profile and field boundary
              to enable location-aware agricultural intelligence.
            </p>

          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#156637] hover:bg-[#104e2a] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Farm</span>
          </button>

        </div>
      )}

      {/* =====================================================
          FARM CARD
      ===================================================== */}

      {currentFarm && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#e8ece8] shadow-card space-y-6">

          {/* HEADER */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-100 gap-3">

            <div>

              <div className="flex items-center gap-2">

                <h2 className="text-xl font-bold text-gray-900">
                  {currentFarm.name}
                </h2>

                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Active Plot
                </span>

              </div>

              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">

                <MapPin className="w-3.5 h-3.5 text-agri-700" />

                <span>
                  {currentFarm.locationName ||
                    'Location not specified'}
                </span>

              </p>

            </div>

            <button
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-[#f2f6f2] transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-agri-700" />
              <span>{t('farm.edit')}</span>
            </button>

          </div>

          {/* =================================================
              STATS
          ================================================= */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">

            <div className="bg-[#f8faf7] p-3 sm:p-4 rounded-2xl border border-agri-100/80">

              <span className="text-[11px] sm:text-xs text-gray-500 font-medium block">
                {t('farm.totalArea')}
              </span>

              <span className="text-sm sm:text-lg font-extrabold text-gray-900 mt-0.5 sm:mt-1 block truncate">
                {currentFarm.areaAcres
                  ? `${currentFarm.areaAcres} acres`
                  : 'Not entered'}
              </span>

            </div>

            <div className="bg-[#f8faf7] p-3 sm:p-4 rounded-2xl border border-agri-100/80">

              <span className="text-[11px] sm:text-xs text-gray-500 font-medium block">
                {t('farm.primaryCrop')}
              </span>

              <span className="text-sm sm:text-lg font-extrabold text-gray-900 mt-0.5 sm:mt-1 block truncate">
                {currentFarm.primaryCrop ||
                  'Not specified'}
              </span>

            </div>

            <div className="bg-[#f8faf7] p-3 sm:p-4 rounded-2xl border border-agri-100/80">

              <span className="text-[11px] sm:text-xs text-gray-500 font-medium block">
                {t('farm.soilType')}
              </span>

              <span className="text-sm sm:text-lg font-extrabold text-gray-900 mt-0.5 sm:mt-1 block truncate">
                {currentFarm.soilType ||
                  'Not specified'}
              </span>

            </div>

            <div className="bg-[#f8faf7] p-3 sm:p-4 rounded-2xl border border-agri-100/80">

              <span className="text-[11px] sm:text-xs text-gray-500 font-medium block">
                {t('farm.irrigation')}
              </span>

              <span className="text-sm sm:text-lg font-extrabold text-gray-900 mt-0.5 sm:mt-1 block truncate">
                {currentFarm.irrigationMethod ||
                  'Not specified'}
              </span>

            </div>

          </div>

          {/* =================================================
              FIELD LOCATION
          ================================================= */}

          <div className="pt-2">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">

              <div className="flex items-center gap-2">

                <Layers className="w-4 h-4 text-agri-700" />

                <h3 className="font-bold text-sm sm:text-base text-gray-900">
                  {t('farm.fieldLocation')}
                </h3>

              </div>

              <div className="flex items-center gap-3 flex-wrap">

                <span className="text-xs text-gray-500 hidden lg:inline">

                  Coordinates:{' '}

                  <strong className="text-gray-800">

                    {currentFarm.latitude &&
                    currentFarm.longitude
                      ? `${currentFarm.latitude}° N, ${currentFarm.longitude}° E`
                      : 'Coordinates not entered'}

                  </strong>

                </span>

                <button
                  onClick={handleOpenEdit}
                  className="text-xs text-agri-800 font-semibold border border-agri-200 bg-agri-50 px-2.5 py-1 rounded-lg hover:bg-agri-100 transition-colors cursor-pointer"
                >
                  {t('farm.updateLocation')}
                </button>

              </div>

            </div>

            {/* =================================================
                MAP
            ================================================= */}

            <div
              className="relative w-full h-[420px] sm:h-[500px] rounded-2xl overflow-hidden border border-gray-200 shadow-inner"
            >

              {currentFarm.latitude &&
              currentFarm.longitude ? (
                <>

                  <MapContainer
                    key={mapKey}
                    center={[
                      currentFarm.latitude,
                      currentFarm.longitude,
                    ]}
                    zoom={17}
                    scrollWheelZoom={true}
                    className="absolute inset-0 w-full h-full z-0"
                  >

                    {/* =================================================
                        SATELLITE
                    ================================================= */}

                    {isSatellite ? (
                      <TileLayer
                        attribution='Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        maxZoom={19}
                      />
                    ) : (
                      <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maxZoom={19}
                      />
                    )}

                    <MapCenterController
                      latitude={currentFarm.latitude}
                      longitude={currentFarm.longitude}
                    />

                    <BoundaryDrawingLayer
                      drawing={isDrawingBoundary}
                      onAddPoint={(point) => {
                        setBoundaryPoints(
                          (prev) => [
                            ...prev,
                            point,
                          ]
                        );
                      }}
                    />

                    {/* =================================================
                        FARM CENTER MARKER
                    ================================================= */}

                    {!isDrawingBoundary && (
                      <Marker
                        position={[
                          currentFarm.latitude,
                          currentFarm.longitude,
                        ]}
                      >
                        <Popup>

                          <div className="min-w-[180px]">

                            <strong className="text-sm">
                              {currentFarm.name}
                            </strong>

                            <p className="text-xs mt-2">
                              {currentFarm.locationName}
                            </p>

                            <p className="text-xs mt-1">
                              Area:{' '}
                              {currentFarm.areaAcres ||
                                '—'}{' '}
                              acres
                            </p>

                            <p className="text-xs mt-1">
                              Crop:{' '}
                              {currentFarm.primaryCrop ||
                                '—'}
                            </p>

                          </div>

                        </Popup>
                      </Marker>
                    )}

                    {/* =================================================
                        BOUNDARY POINT MARKERS
                    ================================================= */}

                    {boundaryPoints.map(
                      (point, index) => (
                        <Marker
                          key={`${point.lat}-${point.lng}-${index}`}
                          position={[
                            point.lat,
                            point.lng,
                          ]}
                        >
                          <Popup>
                            <div className="text-xs">
                              Boundary Point{' '}
                              {index + 1}
                            </div>
                          </Popup>
                        </Marker>
                      )
                    )}

                    {/* =================================================
                        REAL FARM POLYGON
                    ================================================= */}

                    {boundaryPoints.length >= 3 && (
                      <Polygon
                        positions={boundaryPoints.map(
                          (point) => [
                            point.lat,
                            point.lng,
                          ]
                        )}
                        pathOptions={{
                          color: '#15803d',
                          weight: 3,
                          fillColor: '#22c55e',
                          fillOpacity: 0.25,
                        }}
                      />
                    )}

                  </MapContainer>

                  {/* =================================================
                      TOP RIGHT CONTROLS
                  ================================================= */}

                  <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2">

                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-1 flex">

                      <button
                        onClick={() =>
                          setIsSatellite(true)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                          isSatellite
                            ? 'bg-[#156637] text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Satellite className="w-3.5 h-3.5" />
                        Satellite
                      </button>

                      <button
                        onClick={() =>
                          setIsSatellite(false)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                          !isSatellite
                            ? 'bg-[#156637] text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <MapIcon className="w-3.5 h-3.5" />
                        Map
                      </button>

                    </div>

                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white px-3 py-2 rounded-xl shadow-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Google Maps
                      </a>
                    )}

                  </div>

                  {/* =================================================
                      DRAWING PANEL
                  ================================================= */}

                  {isDrawingBoundary && (
                    <div className="absolute top-3 right-3 z-[1000] bg-white rounded-2xl shadow-xl border border-emerald-200 p-3 w-[240px]">

                      <div className="flex items-center gap-2 mb-1">

                        <Pentagon className="w-4 h-4 text-[#156637]" />

                        <strong className="text-xs text-gray-900">
                          Drawing Farm Boundary
                        </strong>

                      </div>

                      <p className="text-[10px] text-gray-500 mb-3">
                        Click on the actual corners
                        of your field on the satellite
                        image.
                      </p>

                      <div className="flex items-center justify-between text-[10px] mb-3">

                        <span className="font-semibold text-gray-700">
                          Points:{' '}
                          {boundaryPoints.length}
                        </span>

                        <span className="font-bold text-[#156637]">
                          {calculatedBoundaryArea}{' '}
                          acres
                        </span>

                      </div>

                      <div className="grid grid-cols-3 gap-1.5">

                        <button
                          type="button"
                          onClick={undoLastPoint}
                          disabled={
                            boundaryPoints.length ===
                            0
                          }
                          className="px-2 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-[10px] font-bold disabled:opacity-40 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3 inline mr-1" />
                          Undo
                        </button>

                        <button
                          type="button"
                          onClick={clearBoundary}
                          disabled={
                            boundaryPoints.length ===
                            0
                          }
                          className="px-2 py-1.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold disabled:opacity-40 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 inline mr-1" />
                          Clear
                        </button>

                        <button
                          type="button"
                          onClick={saveBoundary}
                          disabled={
                            boundaryPoints.length < 3 ||
                            isSavingBoundary
                          }
                          className="px-2 py-1.5 rounded-lg bg-[#156637] text-white text-[10px] font-bold disabled:opacity-40 cursor-pointer"
                        >
                          {isSavingBoundary
                            ? 'Saving...'
                            : 'Save'}
                        </button>

                      </div>

                    </div>
                  )}

                  {/* =================================================
                      DRAW BUTTON
                  ================================================= */}

                  {!isDrawingBoundary && (
                    <button
                      type="button"
                      onClick={
                        startDrawingBoundary
                      }
                      className="absolute bottom-3 right-3 z-[1000] bg-white hover:bg-[#f3f8f3] border border-emerald-200 text-[#156637] px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Pentagon className="w-4 h-4" />
                      {boundaryPoints.length >= 3
                        ? 'Redraw Farm Boundary'
                        : 'Draw Farm Boundary'}
                    </button>
                  )}

                  {/* =================================================
                      MAP BADGE
                  ================================================= */}

                  <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-semibold text-gray-700 shadow-md">

                    {boundaryPoints.length >= 3
                      ? `Real Farm Boundary • ${calculatedBoundaryArea} acres`
                      : 'Real Farm Location • Satellite'}

                  </div>

                </>
              ) : (

                <div className="absolute inset-0 flex items-center justify-center bg-[#f2f6f2]">

                  <div className="text-center px-6">

                    <MapPin className="w-8 h-8 text-agri-700 mx-auto mb-2" />

                    <p className="text-sm font-bold text-gray-800">
                      Farm coordinates not available
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Use “Update Location” to
                      add the actual farm coordinates.
                    </p>

                  </div>

                </div>

              )}

            </div>

            {/* =================================================
                BOUNDARY STATUS
            ================================================= */}

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">

              {boundaryPoints.length >= 3 ? (

                <div className="text-xs text-emerald-700 font-semibold">

                  <Check className="w-3.5 h-3.5 inline mr-1" />

                  Real farm boundary saved •{' '}
                  {calculatedBoundaryArea} acres

                </div>

              ) : (

                <div className="text-xs text-gray-500">

                  No farm boundary saved yet.
                  Click “Draw Farm Boundary” and
                  mark the actual field.

                </div>

              )}

              {boundaryPoints.length >= 3 &&
                !isDrawingBoundary && (
                  <button
                    type="button"
                    onClick={removeBoundary}
                    disabled={isSavingBoundary}
                    className="text-xs text-red-600 font-semibold hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    Remove Boundary
                  </button>
                )}

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">

          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between pb-3 border-b border-gray-100">

              <h3 className="font-bold text-base text-gray-900">
                {isCreating || !currentFarm
                  ? 'Create Your Farm'
                  : 'Manage Farm Plot'}
              </h3>

              <button
                onClick={() =>
                  setIsModalOpen(false)
                }
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4 pt-4"
            >

              {/* FARM NAME */}

              <div>

                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Farm Name{' '}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  placeholder="e.g. Anand Organic Farm"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#156637]"
                  required
                />

              </div>

              {/* LOCATION */}

              <div>

                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Location / Village / District
                </label>

                <input
                  type="text"
                  placeholder="e.g. Bargaon, Udaipur, Rajasthan"
                  value={formData.locationName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      locationName:
                        e.target.value,
                    })
                  }
                  className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#156637]"
                />

              </div>

              {/* COORDINATES */}

              <div className="space-y-2 bg-[#f8faf7] p-3 rounded-xl border border-gray-200/80">

                <div className="flex items-center justify-between">

                  <span className="text-xs font-bold text-gray-700">
                    Coordinates
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        !locationPermissionPrompt
                      ) {
                        setLocationPermissionPrompt(
                          true
                        );
                      } else {
                        requestBrowserGeolocation();
                      }
                    }}
                    disabled={
                      isDetectingLocation
                    }
                    className="inline-flex items-center gap-1 text-[11px] text-[#156637] font-semibold hover:underline cursor-pointer disabled:opacity-60"
                  >

                    {isDetectingLocation ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3 h-3" />
                        Detect Coordinates
                      </>
                    )}

                  </button>

                </div>

                {locationPermissionPrompt && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-2">

                    <p>
                      Your browser will ask for
                      location permission to detect
                      the current coordinates.
                    </p>

                    <div className="flex gap-2">

                      <button
                        type="button"
                        onClick={
                          requestBrowserGeolocation
                        }
                        className="px-2.5 py-1 rounded bg-[#156637] text-white font-semibold cursor-pointer"
                      >
                        Allow & Detect
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setLocationPermissionPrompt(
                            false
                          )
                        }
                        className="px-2 py-1 text-gray-600 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>

                    </div>

                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">

                  <div>

                    <label className="block text-[11px] text-gray-500 mb-0.5">
                      Latitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 24.667"
                      value={
                        formData.latitude || ''
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          latitude:
                            parseFloat(
                              e.target.value
                            ) || 0,
                        })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#156637]"
                    />

                  </div>

                  <div>

                    <label className="block text-[11px] text-gray-500 mb-0.5">
                      Longitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 73.640"
                      value={
                        formData.longitude || ''
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          longitude:
                            parseFloat(
                              e.target.value
                            ) || 0,
                        })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#156637]"
                    />

                  </div>

                </div>

              </div>

              {/* AREA + CROP */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div>

                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Area (Acres)
                  </label>

                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 5"
                    value={
                      formData.areaAcres || ''
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        areaAcres:
                          parseFloat(
                            e.target.value
                          ) || 0,
                      })
                    }
                    className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#156637]"
                  />

                </div>

                <div>

                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Primary Crop
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Wheat, Millet"
                    value={
                      formData.primaryCrop
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primaryCrop:
                          e.target.value,
                      })
                    }
                    className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#156637]"
                  />

                </div>

              </div>

              {/* SOIL + IRRIGATION */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div>

                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Soil Type
                  </label>

                  <select
                    value={formData.soilType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        soilType:
                          e.target.value,
                      })
                    }
                    className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#156637]"
                  >
                    <option value="Loamy">
                      Loamy
                    </option>
                    <option value="Clay">
                      Clay
                    </option>
                    <option value="Sandy Loam">
                      Sandy Loam
                    </option>
                    <option value="Black Cotton">
                      Black Cotton
                    </option>
                    <option value="Red Soil">
                      Red Soil
                    </option>
                    <option value="Alluvial">
                      Alluvial
                    </option>
                  </select>

                </div>

                <div>

                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Irrigation Method
                  </label>

                  <select
                    value={
                      formData.irrigationMethod
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        irrigationMethod:
                          e.target.value,
                      })
                    }
                    className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#156637]"
                  >
                    <option value="Drip">
                      Drip
                    </option>
                    <option value="Sprinkler">
                      Sprinkler
                    </option>
                    <option value="Flood / Furrow">
                      Flood / Furrow
                    </option>
                    <option value="Rainfed">
                      Rainfed
                    </option>
                  </select>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">

                <button
                  type="button"
                  onClick={() =>
                    setIsModalOpen(false)
                  }
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#156637] text-white text-xs font-semibold hover:bg-[#104e2a] flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >

                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {isCreating ||
                      !currentFarm
                        ? 'Create Farm'
                        : 'Save Changes'}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default MyFarmPage;