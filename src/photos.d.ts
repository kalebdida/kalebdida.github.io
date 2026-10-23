declare module 'virtual:photos' {
  const photos: Record<string, { width: number; height: number; srcSet: string }>;
  export default photos;
}
