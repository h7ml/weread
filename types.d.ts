/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="ES2015" />
/// <reference lib="ES2017" />
/// <reference lib="ES2020" />

declare module "$fresh/server.ts" {
  export interface StartOptions {
    port?: number;
    hostname?: string;
    staticDir?: string;
  }

  export interface FreshContext {
    params: Record<string, string>;
    url: URL;
    req: Request;
    state: any;
  }

  export interface HandlerContext extends FreshContext {}

  export function start(manifest: any, options?: StartOptions): Promise<void>;
  export function dev(manifest: any, options?: StartOptions): Promise<void>;
}

declare module "$fresh/*" {
  const content: any;
  export default content;
  export * from content;
}

declare module "preact" {
  export interface ComponentConstructor<P = {}, S = {}> {
    new (props: P, context?: any): Component<P, S>;
  }

  export class Component<P = {}, S = {}> {
    constructor(props: P, context?: any);
    setState(partial: Partial<S> | ((prevState: S, props: P) => Partial<S>), callback?: () => void): void;
    forceUpdate(callback?: () => void): void;
    render(): any;
    componentDidMount?(): void;
    componentWillUnmount?(): void;
    componentDidUpdate?(previousProps: P, previousState: S): void;
    shouldComponentUpdate?(nextProps: P, nextState: S): boolean;
    props: Readonly<P> & Readonly<{ children?: any }>;
    state: Readonly<S>;
    context: any;
  }

  export interface FunctionComponent<P = {}> {
    (props: P & { children?: any }): any;
  }

  export type ComponentType<P = {}> = ComponentConstructor<P> | FunctionComponent<P>;

  export function createElement(type: any, props?: any, ...children: any[]): any;
  export function render(vnode: any, parent: Element | Document | ShadowRoot | DocumentFragment): void;
}

declare module "preact/hooks" {
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useReducer<R extends (prevState: any, action: any) => any>(
    reducer: R,
    initialState: Parameters<R>[0],
    initializer?: (arg: Parameters<R>[0]) => Parameters<R>[0]
  ): [ReturnType<R>, (action: Parameters<R>[1]) => void];
}

declare module "@preact/signals" {
  export interface Signal<T> {
    value: T;
    peek(): T;
    subscribe(fn: (value: T) => void): () => void;
  }

  export function signal<T>(value: T): Signal<T>;
  export function computed<T>(fn: () => T): Signal<T>;
  export function effect(fn: () => void | (() => void)): () => void;
  export function batch(fn: () => void): void;
  export function useSignal<T>(value: T): Signal<T>;
  export function useComputed<T>(fn: () => T): Signal<T>;
  export function useSignalEffect(fn: () => void | (() => void)): void;
}

declare module "preact/jsx-runtime" {
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
  export function Fragment(props: { children?: any }): any;
}

// NodeJS 命名空间声明
declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    NODE_ENV?: string;
    PORT?: string;
    DENO_ENV?: string;
    KV_NAMESPACE?: string;
    LOG_LEVEL?: string;
  }

  interface Process {
    env: ProcessEnv;
    exit(code?: number): never;
    nextTick(callback: Function): void;
    platform: string;
    version: string;
    versions: {
      node: string;
      [key: string]: string;
    };
  }

  interface Timer {
    hasRef(): boolean;
    ref(): this;
    refresh(): this;
    unref(): this;
  }

  interface Timeout extends Timer {}
  interface Immediate extends Timer {}
  interface Global {}
}

// 确保全局类型可用
declare global {
  var JSON: {
    parse(text: string): any;
    stringify(value: any, replacer?: any, space?: any): string;
  };
  
  var Date: {
    new(): Date;
    new(value: number | string): Date;
    prototype: Date;
  };
  
  interface Date {
    toLocaleDateString(locales?: string | string[], options?: any): string;
    getTime(): number;
  }
  
  var Promise: PromiseConstructor;
  
  interface PromiseConstructor {
    new <T>(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Promise<T>;
    resolve<T>(value: T | PromiseLike<T>): Promise<T>;
    reject<T = never>(reason?: any): Promise<T>;
  }
  
  interface Promise<T> {
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): Promise<TResult1 | TResult2>;
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
    ): Promise<T | TResult>;
  }

  var localStorage: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
  };

  var globalThis: {
    location: {
      href: string;
      pathname: string;
    };
  };

  var process: NodeJS.Process;
  var global: NodeJS.Global;
  var Deno: any;

  function fetch(input: string, init?: any): Promise<any>;
  function confirm(message?: string): boolean;
  function alert(message?: any): void;
  function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timeout;
  function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timeout;
  function setImmediate(callback: (...args: any[]) => void, ...args: any[]): NodeJS.Immediate;
  function clearTimeout(timeoutId: NodeJS.Timeout): void;
  function clearInterval(intervalId: NodeJS.Timeout): void;
  function clearImmediate(immediateId: NodeJS.Immediate): void;
}

declare namespace JSX {
  interface IntrinsicElements {
    // HTML elements
    div: any;
    span: any;
    p: any;
    h1: any;
    h2: any;
    h3: any;
    h4: any;
    h5: any;
    h6: any;
    a: any;
    button: any;
    input: any;
    textarea: any;
    select: any;
    option: any;
    img: any;
    svg: any;
    path: any;
    nav: any;
    ul: any;
    li: any;
    ol: any;
    form: any;
    label: any;
    fieldset: any;
    legend: any;
    table: any;
    thead: any;
    tbody: any;
    tr: any;
    td: any;
    th: any;
    section: any;
    article: any;
    aside: any;
    header: any;
    footer: any;
    main: any;
    blockquote: any;
    pre: any;
    code: any;
    strong: any;
    em: any;
    small: any;
    br: any;
    hr: any;
    iframe: any;
    video: any;
    audio: any;
    canvas: any;
    [elemName: string]: any;
  }
  
  interface Element {
    type: any;
    props: any;
    key: any;
  }
  
  interface ElementClass {
    render(): Element;
  }
  
  interface ElementAttributesProperty {
    props: any;
  }
  
  interface ElementChildrenAttribute {
    children: any;
  }
}