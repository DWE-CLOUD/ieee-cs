interface OptimizedImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'inside' | 'cover';
}

export const getOptimizedImageUrl = (src?: string | null, options: OptimizedImageOptions = {}) => {
  if (!src) {
    return '';
  }

  if (!src.startsWith('/uploads/')) {
    return src;
  }

  const params = new URLSearchParams({ src });

  if (options.width) {
    params.set('w', String(options.width));
  }
  if (options.height) {
    params.set('h', String(options.height));
  }
  if (options.quality) {
    params.set('q', String(options.quality));
  }
  if (options.fit) {
    params.set('fit', options.fit);
  }

  return `/api/image?${params.toString()}`;
};
