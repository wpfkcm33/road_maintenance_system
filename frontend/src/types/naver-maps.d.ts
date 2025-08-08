// frontend/src/types/naver-maps.d.ts
// 네이버 지도 API TypeScript 타입 정의

declare global {
  interface Window {
    naver: any;
    navermap_authFailure?: () => void;
  }

  const naver: {
    maps: {
      // 지도 클래스
      Map: new (mapDiv: HTMLElement | string, mapOptions?: any) => NaverMap;
      
      // 좌표 클래스
      LatLng: new (lat: number, lng: number) => NaverLatLng;
      LatLngBounds: new () => NaverLatLngBounds;
      
      // 마커 클래스
      Marker: new (options: NaverMarkerOptions) => NaverMarker;
      
      // 정보창 클래스
      InfoWindow: new (options: NaverInfoWindowOptions) => NaverInfoWindow;
      
      // 유틸리티 클래스
      Size: new (width: number, height: number) => NaverSize;
      Point: new (x: number, y: number) => NaverPoint;
      
      // 이벤트 클래스
      Event: {
        addListener: (target: any, eventName: string, handler: Function) => any;
        removeListener: (listener: any) => void;
        trigger: (target: any, eventName: string, ...args: any[]) => void;
      };
      
      // 지도 타입
      MapTypeId: {
        NORMAL: string;
        TERRAIN: string;
        SATELLITE: string;
        HYBRID: string;
      };
    };
  };
}

// 네이버 지도 인터페이스 정의
export interface NaverMap {
  setCenter(latlng: NaverLatLng): void;
  getCenter(): NaverLatLng;
  setZoom(zoom: number): void;
  getZoom(): number;
  fitBounds(bounds: NaverLatLngBounds, padding?: any): void;
  setMapTypeId(mapTypeId: string): void;
  getMapTypeId(): string;
  addPane(name: string, elementOrZIndex: HTMLElement | number): void;
  removePane(name: string): void;
  refresh(): void;
  autoResize(): void;
  setSize(size: NaverSize): void;
  getSize(): NaverSize;
  destroy(): void;
}

export interface NaverLatLng {
  lat(): number;
  lng(): number;
  equals(latlng: NaverLatLng): boolean;
  toString(): string;
  clone(): NaverLatLng;
}

export interface NaverLatLngBounds {
  extend(latlng: NaverLatLng): void;
  union(bounds: NaverLatLngBounds): NaverLatLngBounds;
  intersects(bounds: NaverLatLngBounds): boolean;
  isEmpty(): boolean;
  getNE(): NaverLatLng;
  getSW(): NaverLatLng;
  getCenter(): NaverLatLng;
  hasLatLng(latlng: NaverLatLng): boolean;
}

export interface NaverMarkerOptions {
  position: NaverLatLng;
  map?: NaverMap;
  icon?: string | NaverMarkerIcon;
  title?: string;
  cursor?: string;
  clickable?: boolean;
  draggable?: boolean;
  visible?: boolean;
  zIndex?: number;
  animation?: number;
}

export interface NaverMarkerIcon {
  url?: string;
  content?: string;
  size?: NaverSize;
  scaledSize?: NaverSize;
  origin?: NaverPoint;
  anchor?: NaverPoint;
}

export interface NaverMarker {
  setPosition(position: NaverLatLng): void;
  getPosition(): NaverLatLng;
  setMap(map: NaverMap | null): void;
  getMap(): NaverMap;
  setIcon(icon: string | NaverMarkerIcon): void;
  getIcon(): string | NaverMarkerIcon;
  setTitle(title: string): void;
  getTitle(): string;
  setVisible(visible: boolean): void;
  getVisible(): boolean;
  setZIndex(zIndex: number): void;
  getZIndex(): number;
  setClickable(clickable: boolean): void;
  getClickable(): boolean;
  setDraggable(draggable: boolean): void;
  getDraggable(): boolean;
  setCursor(cursor: string): void;
  getCursor(): string;
}

export interface NaverInfoWindowOptions {
  content: string;
  maxWidth?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  anchorSize?: NaverSize;
  anchorSkew?: boolean;
  anchorColor?: string;
  pixelOffset?: NaverPoint;
  position?: NaverLatLng;
  disableAutoPan?: boolean;
  disableAnchor?: boolean;
  zIndex?: number;
}

export interface NaverInfoWindow {
  open(map: NaverMap, anchor?: NaverMarker | NaverLatLng): void;
  close(): void;
  getMap(): NaverMap;
  setContent(content: string): void;
  getContent(): string;
  setPosition(position: NaverLatLng): void;
  getPosition(): NaverLatLng;
  setZIndex(zIndex: number): void;
  getZIndex(): number;
}

export interface NaverSize {
  width: number;
  height: number;
  equals(size: NaverSize): boolean;
}

export interface NaverPoint {
  x: number;
  y: number;
  equals(point: NaverPoint): boolean;
  clone(): NaverPoint;
}

// 지도 옵션 인터페이스
export interface NaverMapOptions {
  center?: NaverLatLng;
  zoom?: number;
  mapTypeControl?: boolean;
  mapDataControl?: boolean;
  logoControl?: boolean;
  scaleControl?: boolean;
  zoomControl?: boolean;
  minZoom?: number;
  maxZoom?: number;
  draggable?: boolean;
  pinchZoom?: boolean;
  scrollWheel?: boolean;
  keyboardShortcuts?: boolean;
  disableDoubleTapZoom?: boolean;
  disableDoubleClickZoom?: boolean;
  disableTwoFingerTapZoom?: boolean;
  size?: NaverSize;
  mapTypeId?: string;
}

// 이벤트 타입
export interface NaverMapEvent {
  coord: NaverLatLng;
  point: NaverPoint;
  domEvent: Event;
}

export interface NaverMarkerEvent {
  coord: NaverLatLng;
  point: NaverPoint;
  domEvent: Event;
}

export {};