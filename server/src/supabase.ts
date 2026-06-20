import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase 클라이언트는 프로덕션 조립(container)에서만 생성한다.
// 환경변수가 없으면 인메모리 구현으로 폴백하므로, 여기서 곧장 throw하지 않고
// "자격증명이 준비됐는지"를 별도로 노출한다(테스트는 네트워크 없이 돌아간다).
export const hasSupabaseCredentials = (): boolean =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);

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
