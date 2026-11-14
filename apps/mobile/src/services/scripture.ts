import { SearchResponse, type SearchRequest } from '@biblemates/shared';
import { postJson } from '../lib/server';

/** Finds passages for a mood and/or free text. Results are checked against the shared schema. */
export async function searchScripture(req: SearchRequest): Promise<SearchResponse> {
  return SearchResponse.parse(await postJson('/search', req));
}
