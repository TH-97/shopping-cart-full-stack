import '@testing-library/jest-dom';
import { server } from './src/mocks/server';
import { queryStore } from './src/queries/queryStore';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  queryStore.clear();
});

afterAll(() => server.close());
