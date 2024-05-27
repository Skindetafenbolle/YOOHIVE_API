export interface SearchResult<T> {
  hits: {
    total: { value: number };
    hits: Array<{
      _source: T;
    }>;
  };
}
