// 날씨 데이터 인터페이스
export interface WeatherData {
  temp: number       // 현재 기온 (T1H, ℃)
  feelsLike: number  // 체감온도 (계산값, ℃)
  precipitation: string // 강수형태 라벨 (PTY)
  windSpeed: number  // 풍속 (WSD, m/s)
  pty: string        // 강수형태 코드 (PTY)
  sky: string        // 하늘상태 코드 (SKY: 1=맑음, 3=구름많음, 4=흐림)
  humidity: number   // 습도 (REH, %)
  pop: number        // 강수확률 (POP, %)
  tempMin: number | null  // 오늘 최저기온 (TMN, ℃) - 없을 수 있음
  tempMax: number | null  // 오늘 최고기온 (TMX, ℃) - 없을 수 있음
}

// 대기질 데이터 인터페이스
export interface AirQualityData {
  pm10Value: number
  pm25Value: number
  pm10Grade: string
  pm25Grade: string
  stationName: string
  dataTime: string   // 측정 시각 (예: "2024-03-05 14:00")
  hasFlag: boolean   // 데이터 이상 여부 (pm10Flag / pm25Flag 존재 시 true)
}

// 버스 노선별 도착 정보
export interface BusRouteArrival {
  routeNo: string
  arrMsg1: string
  arrMsg2: string
  direction?: string     // 방향 (예: "월계동")
  routeType?: string     // 노선유형 (1:공항, 2:마을, 3:간선, 4:지선, 5:순환, 6:광역)
  congestion1?: number   // 첫번째 버스 혼잡도 (3:여유, 4:보통, 5:혼잡)
  congestion2?: number   // 두번째 버스 혼잡도
}

// 정류장별 버스 도착 정보
export interface BusStopArrivalData {
  arsId: string
  stopName: string
  routes: BusRouteArrival[]
}

// 버스 정류소 검색 결과 (API 응답)
export interface BusStopSearchItem {
  stId: string     // 정류소 고유 ID
  stNm: string     // 정류소명
  arsId: string    // 정류소 번호 (5자리)
  tmX: string      // 좌표 X (WGS84)
  tmY: string      // 좌표 Y (WGS84)
}

// 정류소별 경유 노선 정보 (API 응답)
export interface BusRouteByStation {
  busRouteId: string    // 노선 ID
  busRouteNm: string    // 노선명 (DB관리용)
  busRouteAbrv: string  // 노선 약칭 (안내용)
  busRouteType: string  // 노선유형 (1:공항, 2:마을, 3:간선, 4:지선, 5:순환, 6:광역)
  term: string          // 배차간격 (분)
  nextBus: string       // 다음 도착 예정 시간
  stBegin: string       // 기점
  stEnd: string         // 종점
}

// 지하철 개별 열차 도착 정보
export interface SubwayTrainArrival {
  arrival: string             // arvlMsg2 (예: "전역 도착", "[4]번째 전역")
  destination: string         // trainLineNm (예: "별내행 - 석촌방면")
  currentStation: string      // arvlMsg3 (예: "강동구청역 도착")
  arrivalSec?: number         // barvlDt - 도착까지 남은 초
}

// 지하철 호선별 도착 정보
export interface SubwayLineArrival {
  lineNo: string
  upTrains: SubwayTrainArrival[]    // 상행 열차 (최대 2개)
  downTrains: SubwayTrainArrival[]  // 하행 열차 (최대 2개)
}

// 지하철 도착 정보 인터페이스
export interface SubwayArrivalData {
  stationName: string
  lines: SubwayLineArrival[]
}
