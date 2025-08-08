// frontend/src/components/map/NaverMap.tsx (우클릭 이벤트 추가)
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Marker as MarkerType } from '../../types/marker';

interface NaverMapProps {
  markers?: MarkerType[];
  onMarkerClick?: (marker: MarkerType) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onMapRightClick?: (lat: number, lng: number) => void; // 우클릭 이벤트 추가
  height?: string;
  showControls?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const NaverMap: React.FC<NaverMapProps> = ({
  markers = [],
  onMarkerClick,
  onMapClick,
  onMapRightClick, // 새로 추가된 props
  height = '400px',
  showControls = true,
  center = { lat: 37.3595704, lng: 127.105399 },
  zoom = 15
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const contextMenuRef = useRef<any>(null); // 컨텍스트 메뉴 참조
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('컴포넌트 마운트 됨');
  const [componentMounted, setComponentMounted] = useState(false);
  const [rightClickPosition, setRightClickPosition] = useState<{lat: number, lng: number} | null>(null);

  // 컨텍스트 메뉴 제거
  const removeContextMenu = useCallback(() => {
    if (contextMenuRef.current) {
      try {
        contextMenuRef.current.setMap(null);
        contextMenuRef.current = null;
      } catch (error) {
        console.error('컨텍스트 메뉴 제거 오류:', error);
      }
    }
  }, []);

  // 컨텍스트 메뉴 생성
  const createContextMenu = useCallback((position: any, lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    const naverMaps = (window as any).naver.maps;
    
    // 기존 컨텍스트 메뉴 제거
    removeContextMenu();

    // 새 컨텍스트 메뉴 생성
    const contextMenuContent = `
      <div style="
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 0;
        min-width: 180px;
        font-size: 14px;
        z-index: 1000;
      ">
        <div style="
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
          background: #f8f9fa;
          border-radius: 8px 8px 0 0;
          font-weight: 500;
          color: #495057;
        ">
          📍 위치: ${lat.toFixed(4)}, ${lng.toFixed(4)}
        </div>
        <div id="context-menu-add-marker" style="
          padding: 12px 16px;
          cursor: pointer;
          border-radius: 0 0 8px 8px;
          transition: background-color 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        " onmouseover="this.style.backgroundColor='#e3f2fd'" 
           onmouseout="this.style.backgroundColor='white'">
          <span style="font-size: 16px;">📍</span>
          <span style="color: #333; font-weight: 500;">여기에 마커 추가</span>
        </div>
      </div>
    `;

    contextMenuRef.current = new naverMaps.InfoWindow({
      content: contextMenuContent,
      backgroundColor: 'transparent',
      borderWidth: 0,
      disableAnchor: true,
      pixelOffset: new naverMaps.Point(10, -10)
    });

    contextMenuRef.current.open(mapInstanceRef.current, position);

    // 컨텍스트 메뉴 클릭 이벤트 등록
    setTimeout(() => {
      const addMarkerButton = document.getElementById('context-menu-add-marker');
      if (addMarkerButton) {
        addMarkerButton.addEventListener('click', () => {
          console.log('🎯 컨텍스트 메뉴에서 마커 추가 클릭:', { lat, lng });
          removeContextMenu();
          if (onMapRightClick) {
            onMapRightClick(lat, lng);
          }
        });
      }
    }, 100);
  }, [onMapRightClick, removeContextMenu]);

  // 기존 API 확인 함수 등은 그대로 유지
  const checkAPIDirectly = useCallback((): boolean => {
    try {
      const hasNaver = typeof (window as any).naver !== 'undefined';
      const hasMaps = hasNaver && (window as any).naver.maps;
      const hasMapClass = hasMaps && typeof (window as any).naver.maps.Map === 'function';
      
      console.log('🔍 컴포넌트에서 API 직접 확인:', {
        hasNaver,
        hasMaps,
        hasMapClass,
        naverMapReady: (window as any).naverMapReady,
        mapRefCurrent: !!mapRef.current,
        componentMounted
      });
      
      return hasMapClass;
    } catch (err) {
      console.error('API 확인 중 오류:', err);
      return false;
    }
  }, [componentMounted]);

  // 지도 생성 함수 (이벤트 리스너 추가됨)
  const createMap = useCallback(() => {
    console.log('🗺️ createMap 호출 - 사전 검사 시작');

    if (mapInstanceRef.current) {
      console.log('✅ 지도 이미 생성됨, 중복 생성 방지');
      setMapReady(true);
      setIsLoading(false);
      return;
    }

    if (!componentMounted || !mapRef.current || !checkAPIDirectly()) {
      console.log('⏳ 사전 조건 미충족, 재시도 대기');
      setTimeout(() => {
        if (mapRef.current && componentMounted) {
          createMap();
        }
      }, 100);
      return;
    }

    try {
      console.log('🗺️ 지도 생성 실제 시작...');
      setDebugInfo('지도 생성 시작');

      const naverMaps = (window as any).naver.maps;
      
      const mapOptions = {
        center: new naverMaps.LatLng(center.lat, center.lng),
        zoom: zoom,
        mapTypeControl: showControls,
        mapDataControl: showControls,
        logoControl: false,
        scaleControl: showControls,
        zoomControl: showControls,
        minZoom: 6,
        maxZoom: 21
      };

      mapInstanceRef.current = new naverMaps.Map(mapRef.current, mapOptions);
      console.log('✅ 지도 인스턴스 생성!');

      const checkMapReady = () => {
        try {
          if (mapInstanceRef.current && 
              typeof mapInstanceRef.current.getCenter === 'function') {
            
            console.log('🎯 지도 완전 준비 완료!');
            setMapReady(true);
            setIsLoading(false);
            setError(null);
            setDebugInfo('지도 준비 완료');

            // 일반 클릭 이벤트
            if (onMapClick) {
              naverMaps.Event.addListener(mapInstanceRef.current, 'click', (e: any) => {
                const latlng = e.coord;
                const lat = latlng.lat();
                const lng = latlng.lng();
                console.log('🖱️ 지도 클릭:', { lat, lng });
                removeContextMenu(); // 클릭 시 컨텍스트 메뉴 제거
                onMapClick(lat, lng);
              });
            }

            // 우클릭 이벤트 (컨텍스트 메뉴)
            naverMaps.Event.addListener(mapInstanceRef.current, 'rightclick', (e: any) => {
              const latlng = e.coord;
              const lat = latlng.lat();
              const lng = latlng.lng();
              console.log('🖱️ 지도 우클릭:', { lat, lng });
              
              // 컨텍스트 메뉴 생성
              createContextMenu(latlng, lat, lng);
              
              // 기본 브라우저 컨텍스트 메뉴 방지
              e.domEvent.preventDefault();
            });

            // 지도의 다른 곳 클릭 시 컨텍스트 메뉴 제거
            naverMaps.Event.addListener(mapInstanceRef.current, 'click', () => {
              removeContextMenu();
            });

            console.log('🖱️ 모든 이벤트 리스너 등록 완료');
            return true;
          }
          return false;
        } catch (err) {
          console.error('지도 준비 확인 중 오류:', err);
          return false;
        }
      };

      // idle 이벤트 등록
      naverMaps.Event.addListener(mapInstanceRef.current, 'idle', () => {
        if (!mapReady) {
          checkMapReady();
        }
      });

      // 폴링으로 준비 상태 확인
      let checkCount = 0;
      const pollMapReady = () => {
        checkCount++;
        setDebugInfo(`지도 준비 확인 중... (${checkCount}/20)`);
        
        if (checkMapReady()) {
          return;
        }
        
        if (checkCount < 20) {
          setTimeout(pollMapReady, 200);
        } else {
          console.warn('⚠️ 지도 준비 타임아웃, 강제 완료');
          setMapReady(true);
          setIsLoading(false);
          setDebugInfo('지도 준비 완료 (타임아웃)');
        }
      };

      setTimeout(pollMapReady, 100);

    } catch (err) {
      console.error('❌ 지도 생성 실패:', err);
      setError(`지도 생성 실패: ${err}`);
      setIsLoading(false);
      setDebugInfo(`지도 생성 실패: ${err}`);
    }
  }, [componentMounted, checkAPIDirectly, center, zoom, showControls, onMapClick, mapReady, createContextMenu, removeContextMenu]);

  // 컴포넌트 마운트 및 API 확인 로직은 기존과 동일
  useEffect(() => {
    console.log('🚀 NaverMap 컴포넌트 마운트됨');
    
    const mountTimer = setTimeout(() => {
      setComponentMounted(true);
    }, 0);

    return () => {
      clearTimeout(mountTimer);
      console.log('🧹 NaverMap 컴포넌트 언마운트');
      
      // 컨텍스트 메뉴 정리
      removeContextMenu();
      
      // 마커 정리
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
    };
  }, [removeContextMenu]);

  useEffect(() => {
    if (!componentMounted) {
      return;
    }

    console.log('🔍 컴포넌트 마운트 완료, API 확인 시작');
    
    let mounted = true;
    let attemptCount = 0;
    const maxAttempts = 100;

    const tryCreateMap = () => {
      if (!mounted || !componentMounted) return;
      
      attemptCount++;
      setDebugInfo(`API 확인 시도 ${attemptCount}/${maxAttempts}`);
      
      if (checkAPIDirectly()) {
        console.log('✅ API 확인 성공, 지도 생성 시작!');
        createMap();
        return;
      }

      if ((window as any).naverMapReady) {
        console.log('✅ 전역 상태 확인 성공, 지도 생성 시작!');
        createMap();
        return;
      }

      if (attemptCount < maxAttempts) {
        setTimeout(tryCreateMap, 500);
      } else {
        console.error('❌ API 확인 최대 재시도 초과');
        setError('네이버 지도 API를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
        setIsLoading(false);
        setDebugInfo('API 확인 타임아웃');
      }
    };

    if (checkAPIDirectly()) {
      console.log('🎯 즉시 API 확인 성공!');
      createMap();
    } else {
      console.log('⏳ API 로드 대기 시작...');
      setTimeout(tryCreateMap, 100);
    }

    const handleNaverReady = () => {
      if (mounted && componentMounted && !mapReady && !mapInstanceRef.current) {
        console.log('🎉 naverMapReady 이벤트 수신! (보조)');
        setTimeout(createMap, 50);
      }
    };

    window.addEventListener('naverMapReady', handleNaverReady);

    return () => {
      mounted = false;
      window.removeEventListener('naverMapReady', handleNaverReady);
    };
  }, [componentMounted, checkAPIDirectly, createMap, mapReady]);

  // 마커 업데이트 로직은 기존과 동일
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) {
      console.log('⏸️ 마커 업데이트 대기 (지도 미준비)');
      return;
    }

    console.log(`🏷️ 마커 업데이트 시작: ${markers.length}개`);

    const naverMaps = (window as any).naver.maps;
    
    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 새 마커 추가
    markers.forEach((markerData, index) => {
      try {
        const position = new naverMaps.LatLng(markerData.latitude, markerData.longitude);
        
        const marker = new naverMaps.Marker({
          position: position,
          map: mapInstanceRef.current,
          title: markerData.title,
          icon: {
            content: `
              <div style="
                width: 32px; height: 32px; 
                background: ${markerData.priority === 'urgent' ? '#ef4444' : markerData.priority === 'high' ? '#f97316' : '#10b981'};
                border: 3px solid white; border-radius: 50%; 
                box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                display: flex; align-items: center; justify-content: center;
                color: white; font-size: 16px; cursor: pointer;
                transition: transform 0.2s ease;
              " 
              onmouseover="this.style.transform='scale(1.1)'" 
              onmouseout="this.style.transform='scale(1)'">
                ${markerData.priority === 'urgent' ? '🚨' : markerData.priority === 'high' ? '⚠️' : '📍'}
              </div>
            `,
            size: new naverMaps.Size(32, 32),
            anchor: new naverMaps.Point(16, 16)
          }
        });

        // 클릭 이벤트
        if (onMarkerClick) {
          naverMaps.Event.addListener(marker, 'click', () => {
            console.log('📍 마커 클릭:', markerData.title);
            removeContextMenu(); // 마커 클릭 시도 컨텍스트 메뉴 제거
            onMarkerClick(markerData);
          });
        }

        // 간단한 정보창
        const infoWindow = new naverMaps.InfoWindow({
          content: `
            <div style="padding:8px;max-width:180px;font-size:12px;line-height:1.4;">
              <strong style="color:#333;">${markerData.title}</strong><br>
              <span style="color:#666;">${markerData.description || ''}</span><br>
              <small style="color:#999;">${markerData.road_name || markerData.address || ''}</small>
            </div>
          `,
          backgroundColor: 'white',
          borderColor: '#ddd',
          borderWidth: 1,
          pixelOffset: new naverMaps.Point(0, -5)
        });

        naverMaps.Event.addListener(marker, 'mouseover', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });

        naverMaps.Event.addListener(marker, 'mouseout', () => {
          infoWindow.close();
        });

        markersRef.current.push(marker);
        console.log(`✅ 마커 ${index + 1} 생성: ${markerData.title}`);
        
      } catch (err) {
        console.error(`❌ 마커 생성 실패 (${markerData.title}):`, err);
      }
    });

    // 지도 범위 조정
    if (markers.length > 0 && mapInstanceRef.current) {
      try {
        if (markers.length === 1) {
          mapInstanceRef.current.setCenter(
            new naverMaps.LatLng(markers[0].latitude, markers[0].longitude)
          );
          mapInstanceRef.current.setZoom(16);
        } else {
          const bounds = new naverMaps.LatLngBounds();
          markers.forEach(marker => {
            bounds.extend(new naverMaps.LatLng(marker.latitude, marker.longitude));
          });
          mapInstanceRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
        }
        console.log('🎯 지도 범위 조정 완료');
      } catch (err) {
        console.error('❌ 범위 조정 실패:', err);
      }
    }
  }, [markers, onMarkerClick, mapReady, removeContextMenu]);

  // 수동 지도 생성 버튼 핸들러
  const handleManualCreate = () => {
    console.log('🔧 수동 지도 생성 시도');
    setIsLoading(true);
    setError(null);
    setDebugInfo('수동 생성 시도 중...');
    removeContextMenu();
    mapInstanceRef.current = null;
    setMapReady(false);
    createMap();
  };

  return (
    <div className="relative">
      {/* 지도 컨테이너 */}
      <div 
        ref={mapRef} 
        style={{ height }}
        className="w-full rounded-lg overflow-hidden shadow-lg bg-gray-200"
        onContextMenu={(e) => {
          // 브라우저 기본 컨텍스트 메뉴 방지는 네이버 지도에서 처리
          if (!mapReady) {
            e.preventDefault();
          }
        }}
      />
      
      {/* 로딩 오버레이 */}
      {(isLoading || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-20">
          {error ? (
            <div className="text-center text-red-700 p-6">
              <div className="text-4xl mb-3">❌</div>
              <p className="font-medium text-lg mb-2">지도 로드 오류</p>
              <p className="text-sm mb-4">{error}</p>
              <div className="space-y-2">
                <button 
                  onClick={() => window.location.reload()} 
                  className="block mx-auto px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
                >
                  새로고침
                </button>
                <button 
                  onClick={handleManualCreate}
                  className="block mx-auto px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors text-sm"
                >
                  수동 생성 시도
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-3"></div>
              <p className="text-lg font-medium">네이버 지도 준비 중...</p>
              <p className="text-sm mt-1">{debugInfo}</p>
            </div>
          )}
        </div>
      )}
      
      {/* 줌 컨트롤 */}
      {mapReady && !isLoading && !error && (
        <div className="absolute top-3 right-3 bg-white rounded-lg shadow-md overflow-hidden z-10">
          <button 
            onClick={() => {
              if (mapInstanceRef.current) {
                const zoom = mapInstanceRef.current.getZoom();
                mapInstanceRef.current.setZoom(zoom + 1);
              }
            }}
            className="block w-10 h-10 bg-white hover:bg-gray-100 border-b border-gray-200 text-lg font-bold transition-colors"
            title="확대"
          >
            +
          </button>
          <button 
            onClick={() => {
              if (mapInstanceRef.current) {
                const zoom = mapInstanceRef.current.getZoom();
                mapInstanceRef.current.setZoom(zoom - 1);
              }
            }}
            className="block w-10 h-10 bg-white hover:bg-gray-100 text-lg font-bold transition-colors"
            title="축소"
          >
            −
          </button>
        </div>
      )}
      
      {/* 사용법 안내 */}
      {mapReady && !isLoading && !error && (
        <div className="absolute top-3 left-3 bg-white bg-opacity-95 rounded-lg px-3 py-2 shadow-md z-10 max-w-xs">
          <p className="text-xs text-gray-600">
            💡 <strong>지도 우클릭</strong>으로 새 마커를 추가할 수 있습니다.
          </p>
        </div>
      )}
      
      {/* 상태 정보 */}
      <div className="absolute bottom-3 left-3 bg-white bg-opacity-95 rounded-lg px-3 py-2 shadow-md z-10">
        <div className="flex items-center space-x-2 text-sm">
          {mapReady ? (
            <>
              <span className="text-green-600 font-medium">✅ 지도 준비</span>
              <span className="text-gray-600">📍 {markers.length}개</span>
            </>
          ) : (
            <>
              <span className="text-orange-600 font-medium">⏳ 로딩중</span>
              <span className="text-gray-600">컨테이너: {mapRef.current ? '✅' : '❌'}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NaverMap;