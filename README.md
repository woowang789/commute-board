# Commute Board

서울 지역의 **실시간 날씨, 미세먼지, 버스, 지하철 도착 정보**를 한눈에 볼 수 있는 출퇴근 정보 대시보드입니다.

카드 기반 UI로 필요한 정보만 골라서 구성할 수 있으며, 모바일 우선 다크 터미널 테마로 디자인되었습니다.

## 주요 기능

### 날씨 카드
- 기상청 초단기실황 + 단기예보 API 활용
- 현재 기온, 체감온도, 최저/최고기온, 풍속, 습도, 강수확률 표시
- 전국 약 2,510개 시군구 지역 지원
- 10분마다 자동 갱신

### 미세먼지 카드
- 에어코리아 실시간 대기질 API 활용
- PM10 / PM2.5 농도 및 등급 표시 (좋음/보통/나쁨/매우나쁨)
- 등급별 색상 변화 및 마스크 착용 권고 배너
- 서울 25개 자치구 지원
- 10분마다 자동 갱신

### 버스 카드
- 서울시 버스 도착정보 API 활용
- 정류소별 실시간 버스 도착 정보
- 노선유형별 색상 구분 (간선/지선/광역/마을 등)
- 차량 혼잡도 표시
- 30초마다 자동 갱신

### 지하철 카드
- 서울시 실시간 지하철 도착 API 활용
- 호선별 상행/하행 열차 도착 정보
- 서울 지하철 563개 역 지원 (1~9호선, 신분당선, 경의중앙선, GTX-A 등)
- 30초마다 자동 갱신

### 카드 관리
- 3단계 마법사를 통한 간편한 카드 추가
- 카드별 삭제 기능
- localStorage 기반 설정 저장 (서버 불필요)

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16, React 19 |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS 4 |
| UI 컴포넌트 | shadcn/ui (Radix UI v1.4) |
| 데이터 페칭 | SWR v2 (자동 갱신 + 캐싱) |
| 스키마 검증 | Zod v4 |
| 아이콘 | Lucide React |

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm (또는 yarn, pnpm, bun)

### 설치

```bash
git clone <repository-url>
cd commute-board
npm install
```

### 환경 변수 설정

`.env.local.example`을 복사하여 `.env.local` 파일을 생성하고, 각 API 키를 입력합니다.

```bash
cp .env.local.example .env.local
```

```env
KMA_API_KEY=        # 기상청 단기예보 API 키
AIRKOREA_API_KEY=   # 에어코리아 API 키
SEOUL_BUS_API_KEY=  # 서울시 버스 도착정보 API 키
SEOUL_SUBWAY_API_KEY= # 서울시 지하철 실시간 도착 API 키
```

#### API 키 발급처

| API | 발급처 | 비고 |
|-----|--------|------|
| 기상청 단기예보 | [공공데이터포털 (data.go.kr)](https://www.data.go.kr/data/15084084/openapi.do) | 초단기실황 + 단기예보 |
| 에어코리아 대기질 | [공공데이터포털 (data.go.kr)](https://www.data.go.kr/data/15073861/openapi.do) | 측정소별 실시간 측정정보 |
| 서울시 버스 도착정보 | [서울 열린데이터광장 (data.seoul.go.kr)](https://data.seoul.go.kr/dataList/OA-12912/A/1/datasetView.do) | 정류소정보조회 웹서비스 |
| 서울시 지하철 도착정보 | [서울 열린데이터광장 (data.seoul.go.kr)](https://data.seoul.go.kr/dataList/OA-12764/F/1/datasetView.do) | 실시간 도착정보 오픈API |

> API 키 없이도 버스/지하철은 Mock 데이터로 동작합니다.

### 실행

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

개발 서버 실행 후 [http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 사용 방법

1. 우측 상단의 **+ 버튼**을 클릭하여 카드 추가 마법사를 엽니다.
2. 카드 타입을 선택합니다 (날씨 / 미세먼지 / 대중교통).
3. 지역 또는 정류소/역을 검색하여 선택합니다.
4. 추가된 카드는 자동으로 실시간 데이터를 갱신합니다.
5. 카드 우측 상단의 **X 버튼**으로 카드를 삭제할 수 있습니다.

## 프로젝트 구조

```
src/
├── app/
│   ├── actions/           # Next.js Server Actions (API 호출)
│   │   ├── weather.ts     # 기상청 날씨 API
│   │   ├── dust.ts        # 에어코리아 미세먼지 API
│   │   ├── bus.ts         # 서울시 버스 API
│   │   └── subway.ts      # 서울시 지하철 API
│   ├── globals.css        # 전역 스타일 (터미널 테마)
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 메인 페이지
├── components/
│   ├── ui/                # shadcn 기반 UI 컴포넌트
│   ├── WeatherCard.tsx    # 날씨 카드
│   ├── DustCard.tsx       # 미세먼지 카드
│   ├── BusCard.tsx        # 버스 카드
│   ├── SubwayCard.tsx     # 지하철 카드
│   ├── AddCardDialog.tsx  # 카드 추가 마법사
│   ├── ApiCreditsDialog.tsx # API 출처 정보
│   ├── CardSkeleton.tsx   # 로딩 스켈레톤
│   └── CardError.tsx      # 에러 상태
├── hooks/
│   ├── useCards.ts        # 카드 CRUD (localStorage)
│   └── useUserId.ts       # 사용자 식별자 관리
├── types/
│   └── card.ts            # 카드 타입 + Zod 스키마
├── constants/
│   ├── refreshIntervals.ts  # 갱신 주기 상수
│   ├── regionGridFull.ts    # 기상청 격자 좌표 (전국)
│   ├── districtDongMap.ts   # 자치구 → 측정소 매핑
│   └── subwayStations.ts   # 지하철역 목록 (563개)
├── lib/
│   ├── logger.ts          # 구조화 로깅 (API 키 마스킹)
│   ├── swr.ts             # SWR 공통 유틸
│   ├── utils.ts           # cn() 클래스 병합
│   ├── weatherIcon.ts     # 날씨 아이콘 매핑
│   └── windChill.ts       # 체감온도 계산
└── mocks/
    ├── busMock.ts           # 버스 도착 Mock
    ├── busStopMock.ts       # 정류소 검색 Mock
    └── subwayStationMock.ts # 지하철역 검색 Mock
```

## API 키 없이 테스트하기

API 키가 없어도 기본적인 기능을 확인할 수 있습니다.

| 카드 | API 키 없을 때 |
|------|----------------|
| 날씨 | 에러 메시지 표시 |
| 미세먼지 | 에러 메시지 표시 |
| 버스 | Mock 데이터로 자동 전환 (정상 동작) |
| 지하철 | Mock 데이터로 자동 전환 (정상 동작) |

버스와 지하철 카드는 API 키 없이도 Mock 데이터를 통해 UI와 동작을 확인할 수 있습니다.

## 데이터 저장

모든 설정은 브라우저의 **localStorage**에 저장됩니다. 별도의 서버나 데이터베이스가 필요하지 않습니다.

| 키 | 용도 |
|----|------|
| `commute-board-cards` | 카드 목록 (타입, 지역, 노선 등) |
| `commute-board-uid` | 사용자 식별자 (8자리, 로그 추적용) |

## 배포

### Vercel

Next.js 프로젝트이므로 [Vercel](https://vercel.com)에 바로 배포할 수 있습니다.

1. GitHub에 저장소를 푸시합니다.
2. Vercel에서 저장소를 연결합니다.
3. 환경 변수에 API 키를 등록합니다.
4. 배포합니다.

## 라이선스

MIT
