import '@testing-library/jest-dom';
import { server } from './src/mocks/server';
import { resetMockCart } from './src/mocks/handlers';
import { queryStore } from './src/queries/queryStore';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  resetMockCart();
  localStorage.clear();
  queryStore.clear();
});

afterAll(() => server.close());
