// API 서버 주소. 빌드 시점에 Vite가 __API_BASE_URL__를 주입한다(vite.config.ts의 define).
// 빌드: 프로덕션=Railway, 개발=localhost. jest 등 define이 없는 환경에선 폴백으로 로컬을 쓴다.
declare const __API_BASE_URL__: string | undefined;

export const API_BASE_URL =
  typeof __API_BASE_URL__ !== 'undefined'
    ? __API_BASE_URL__
    : 'http://localhost:3000';
