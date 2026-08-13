import { expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import './webrtc-mock';

vi.stubEnv('VITE_SUPABASE_URL', 'https://mock.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'mock-key');

afterEach(() => {
  vi.clearAllMocks();
});
