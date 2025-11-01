// functions/types.d.ts
//
// Minimal type declarations to satisfy the TypeScript compiler without
// installing external dependencies. These types are intentionally
// permissive (using any) because the compiled JavaScript relies on
// Firebase and Express at runtime. When using a real environment
// (e.g. via npm install firebase-functions), these definitions may be
// overridden by the actual type packages.

// functions/types.d.ts

// 極簡 express 介面，僅含本專案實際用到的形狀
declare module 'express' {
  export interface Request {
    method: string;
    headers: { [k: string]: string | undefined };
    body?: any;
  }
  export interface Response {
    setHeader(name: string, value: string): void;
    status(code: number): this;
    json(body: any): this;
    end(): void;
  }
}

// 將 onRequest 的 handler 指到上面這組型別，避免 req/res 變 any
declare module 'firebase-functions/v2/https' {
  export function onRequest(
    config: any,
    handler: (req: import('express').Request, res: import('express').Response) => any
  ): any;
}


declare module 'express' {
  export interface Request { [key: string]: any; }
  export interface Response {
    [key: string]: any;
    setHeader(name: string, value: string): any;
    status(code: number): this;
    json(body: any): this;
    end(): void;
  }
  export interface NextFunction { (err?: any): void; }
}