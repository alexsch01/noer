declare function _exports({
  publicDir,
  port,
  hostname,
  routes,
  httpsOptions,
}: {
  publicDir: string;
  port: number;
  hostname?: string;
  routes? Record<string, ((data: any) => Promise<string>) | string>;
  httpsOptions?: {
    key: string;
    cert: string;
  };
}): void;

export = _exports;
