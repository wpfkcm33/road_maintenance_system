import React from 'react';
import { Analysis } from '../../types/analysis';

interface AIAnalysisResultProps {
  analysis: Analysis;
  onStartAnalysis?: () => void;
  canStartAnalysis?: boolean;
}

const AIAnalysisResult: React.FC<AIAnalysisResultProps> = ({ 
  analysis, 
  onStartAnalysis,
  canStartAnalysis = false 
}) => {
  const isCompleted = analysis.status === 'completed';
  const isProcessing = analysis.status === 'processing';
  const isFailed = analysis.status === 'failed';

  if (!isCompleted && !isProcessing && !isFailed) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-4xl mb-3">🤖</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">AI 분석 대기 중</h3>
        <p className="text-gray-600 mb-4">
          이 영상은 아직 AI 분석이 시작되지 않았습니다.
        </p>
        {canStartAnalysis && onStartAnalysis && (
          <button
            onClick={onStartAnalysis}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            🚀 AI 분석 시작
          </button>
        )}
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mr-3"></div>
          <h3 className="text-lg font-semibold text-yellow-900">🤖 AI 분석 진행 중</h3>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-yellow-700 mb-1">
            <span>진행률</span>
            <span>{analysis.progress}%</span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-3">
            <div 
              className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${analysis.progress}%` }}
            ></div>
          </div>
        </div>
        
        <p className="text-sm text-yellow-700">
          YOLO 모델이 영상을 프레임별로 분석하고 있습니다. 잠시만 기다려주세요.
        </p>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-3">
          <span className="text-2xl mr-3">❌</span>
          <h3 className="text-lg font-semibold text-red-900">AI 분석 실패</h3>
        </div>
        
        <p className="text-red-700 mb-3">
          {analysis.error_message || '알 수 없는 오류로 분석에 실패했습니다.'}
        </p>
        
        {canStartAnalysis && onStartAnalysis && (
          <button
            onClick={onStartAnalysis}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            🔄 다시 분석
          </button>
        )}
      </div>
    );
  }

  // 분석 완료 상태
  return (
    <div className="space-y-6">
      {/* 분석 요약 */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">✅</span>
          <h3 className="text-lg font-semibold text-gray-900">🤖 AI 분석 완료</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analysis.total_cracks_detected}</div>
            <div className="text-sm text-gray-600">검출된 균열</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{analysis.total_crack_area.toFixed(1)}m²</div>
            <div className="text-sm text-gray-600">총 균열 면적</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{(analysis.confidence_score * 100).toFixed(0)}%</div>
            <div className="text-sm text-gray-600">평균 신뢰도</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">100%</div>
            <div className="text-sm text-gray-600">분석 완료</div>
          </div>
        </div>
      </div>
      
      {/* 심각도 분석 */}
      {analysis.severity_analysis && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            심각도 분석
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">전체 심각도:</span>
                <span className={`font-semibold ${
                  analysis.severity_analysis.overall_severity === '위험' 
                    ? 'text-red-600' 
                    : analysis.severity_analysis.overall_severity === '보통'
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}>
                  {analysis.severity_analysis.overall_severity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">위험 점수:</span>
                <span className="font-semibold">{analysis.severity_analysis.risk_score}/100</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">긴급 보수 필요:</span>
                <span className={`font-semibold ${
                  analysis.severity_analysis.urgent_repairs_needed ? 'text-red-600' : 'text-green-600'
                }`}>
                  {analysis.severity_analysis.urgent_repairs_needed ? '예' : '아니오'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">예상 작업 시간:</span>
                <span className="font-semibold">{analysis.severity_analysis.estimated_repair_time}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 균열 상세 정보 */}
      {analysis.crack_details && analysis.crack_details.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">🔍</span>
            검출된 균열 상세 ({analysis.crack_details.length}개)
          </h4>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {analysis.crack_details.slice(0, 5).map((crack: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{crack.crack_type || `균열 #${index + 1}`}</div>
                  <div className="text-sm text-gray-600">
                    면적: {crack.area?.toFixed(3)}m² | 신뢰도: {(crack.confidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  crack.severity === '위험' 
                    ? 'bg-red-100 text-red-800'
                    : crack.severity === '보통'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {crack.severity}
                </div>
              </div>
            ))}
            {analysis.crack_details.length > 5 && (
              <div className="text-center text-sm text-gray-500 py-2">
                + {analysis.crack_details.length - 5}개 더 있음
              </div>
            )}
          </div>
        </div>
      )}

      {/* 보수재 용량 산정 */}
      {analysis.material_estimation && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">🧱</span>
            보수재 용량 산정
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {analysis.material_estimation.asphalt_concrete}톤
              </div>
              <div className="text-sm text-blue-800">아스팔트 콘크리트</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {analysis.material_estimation.sealer}L
              </div>
              <div className="text-sm text-green-800">실러</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {analysis.material_estimation.primer}L
              </div>
              <div className="text-sm text-purple-800">프라이머</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {analysis.material_estimation.total_cost?.toLocaleString()}원
            </div>
            <div className="text-sm text-gray-600">예상 총 비용</div>
          </div>
        </div>
      )}

      {/* 분석 시간 정보 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">분석 시작:</span>
            <span className="ml-2 text-gray-900">
              {analysis.started_at ? new Date(analysis.started_at).toLocaleString('ko-KR') : '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">분석 완료:</span>
            <span className="ml-2 text-gray-900">
              {analysis.completed_at ? new Date(analysis.completed_at).toLocaleString('ko-KR') : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisResult;