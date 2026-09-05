/// <reference types="vite/client" />

import type { DesktopApi } from "../../shared/types";

declare global {
  interface Window {
    codexDesktop: DesktopApi;
  }
}

export {};
