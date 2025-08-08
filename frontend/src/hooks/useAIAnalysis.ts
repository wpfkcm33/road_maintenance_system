// frontend/src/hooks/useAIAnalysis.ts
import { useState, useEffect } from 'react';
import { Analysis } from '../types/analysis';
import { analysisService } from '../services/analysisService';

export const useAnalyses = (videoId: number | null) => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyses = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await analysisService.getVideoAnalyses(id);
      setAnalyses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 결과 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async (id: number): Promise<Analysis | null> => {
    try {
      const newAnalysis = await analysisService.startAnalysis(id);
      setAnalyses(prev => [newAnalysis, ...prev]);
      return newAnalysis;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 분석 시작 중 오류가 발생했습니다.');
      return null;
    }
  };

  useEffect(() => {
    if (videoId) {
      fetchAnalyses(videoId);
    }
  }, [videoId]);

  return {
    analyses,
    loading,
    error,
    refetch: () => videoId && fetchAnalyses(videoId),
    startAnalysis: () => videoId && startAnalysis(videoId)
  };
};

export const useAnalysis = (id: number | null) => {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async (analysisId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await analysisService.getAnalysis(analysisId);
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 결과 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAnalysis(id);
    }
  }, [id]);

  return {
    analysis,
    loading,
    error,
    refetch: () => id && fetchAnalysis(id)
  };
};