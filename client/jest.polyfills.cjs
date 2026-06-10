// MSW v2를 jsdom 환경에서 돌리기 위한 웹 표준 API 폴리필
const { TextEncoder, TextDecoder } = require('node:util');
const {
  ReadableStream,
  TransformStream,
  WritableStream,
} = require('node:stream/web');
const {
  MessageChannel,
  MessagePort,
  BroadcastChannel,
} = require('node:worker_threads');

const define = (props) => {
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(globalThis, key, {
      value,
      writable: true,
      configurable: true,
    });
  }
};

// undici를 require하기 전에 먼저 전역에 깔아둬야 한다 (undici가 MessagePort 등을 참조)
define({
  TextEncoder,
  TextDecoder,
  ReadableStream,
  TransformStream,
  WritableStream,
  MessageChannel,
  MessagePort,
  BroadcastChannel,
});

const { fetch, Headers, FormData, Request, Response } = require('undici');

define({ fetch, Headers, FormData, Request, Response });
