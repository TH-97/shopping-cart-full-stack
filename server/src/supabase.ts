import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase 클라이언트는 프로덕션 조립(container)에서만 생성한다.
// 프로덕션은 Supabase 전용이므로 자격증명이 없으면 곧장 throw한다(테스트는 인메모리 더블 사용).
export const createSupabaseClient = (): SupabaseClient => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL / SUPABASE_KEY 환경변수가 필요합니다. server/.env를 확인하세요.',
    );
  }

  return createClient(url, key);
};
