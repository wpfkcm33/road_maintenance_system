// frontend/src/hooks/useMarkers.ts
import { useState, useEffect } from 'react';
import { Marker, MarkerCreate, MarkerUpdate } from '../types/marker';
import { markerService, MarkerQueryParams } from '../services/markerService';

export const useMarkers = (params: MarkerQueryParams = {}) => {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await markerService.getMarkers(params);
      setMarkers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '마커 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const createMarker = async (marker: MarkerCreate): Promise<Marker | null> => {
    try {
      const newMarker = await markerService.createMarker(marker);
      setMarkers(prev => [newMarker, ...prev]);
      return newMarker;
    } catch (err) {
      setError(err instanceof Error ? err.message : '마커 생성 중 오류가 발생했습니다.');
      return null;
    }
  };

  const updateMarker = async (id: number, updates: MarkerUpdate): Promise<Marker | null> => {
    try {
      const updatedMarker = await markerService.updateMarker(id, updates);
      setMarkers(prev => prev.map(marker => 
        marker.id === id ? updatedMarker : marker
      ));
      return updatedMarker;
    } catch (err) {
      setError(err instanceof Error ? err.message : '마커 수정 중 오류가 발생했습니다.');
      return null;
    }
  };

  const deleteMarker = async (id: number): Promise<boolean> => {
    try {
      await markerService.deleteMarker(id);
      setMarkers(prev => prev.filter(marker => marker.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '마커 삭제 중 오류가 발생했습니다.');
      return false;
    }
  };

  useEffect(() => {
    fetchMarkers();
  }, [JSON.stringify(params)]);

  return {
    markers,
    loading,
    error,
    refetch: fetchMarkers,
    createMarker,
    updateMarker,
    deleteMarker
  };
};

export const useMarker = (id: number | null) => {
  const [marker, setMarker] = useState<Marker | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarker = async (markerId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await markerService.getMarker(markerId);
      setMarker(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '마커 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMarker(id);
    }
  }, [id]);

  return {
    marker,
    loading,
    error,
    refetch: () => id && fetchMarker(id)
  };
};
