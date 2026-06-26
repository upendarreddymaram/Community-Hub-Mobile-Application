const LOG_PREFIX = '[CommunityHub API]';

function summarizePayload(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return {
      type: 'array',
      length: data.length,
      sample: data.slice(0, 2),
    };
  }

  if (typeof data === 'object') {
    const record = data as Record<string, unknown>;

    if ('categories' in record && Array.isArray(record.categories)) {
      return {
        type: 'DiscourseSiteResponse',
        categoryCount: record.categories.length,
        sampleCategories: record.categories.slice(0, 3),
      };
    }

    if (
      'topic_list' in record &&
      record.topic_list &&
      typeof record.topic_list === 'object'
    ) {
      const topicList = record.topic_list as { topics?: unknown[] };
      return {
        type: 'DiscourseCategoryTopicsResponse',
        topicCount: topicList.topics?.length ?? 0,
        category: record.category ?? null,
        sampleTopics: topicList.topics?.slice(0, 3) ?? [],
      };
    }

    const keys = Object.keys(record);
    return {
      type: 'object',
      keys: keys.slice(0, 12),
      keyCount: keys.length,
    };
  }

  return data;
}

export function logApiStart(url: string, method = 'GET'): void {
  if (!__DEV__) {
    return;
  }

  console.log(`${LOG_PREFIX} → ${method} ${url}`);
}

export function logApiSuccess(url: string, data: unknown, durationMs: number): void {
  if (!__DEV__) {
    return;
  }

  console.log(`${LOG_PREFIX} ✓ ${url} (${durationMs}ms)`);
  console.log(`${LOG_PREFIX}   summary:`, summarizePayload(data));
  console.log(`${LOG_PREFIX}   full response:`, data);
}

export function logApiFailure(url: string, error: unknown, durationMs: number): void {
  if (!__DEV__) {
    return;
  }

  console.warn(`${LOG_PREFIX} ✗ ${url} (${durationMs}ms)`, error);
}

export function logApiInfo(message: string, details?: unknown): void {
  if (!__DEV__) {
    return;
  }

  if (details !== undefined) {
    console.log(`${LOG_PREFIX} ${message}`, details);
  } else {
    console.log(`${LOG_PREFIX} ${message}`);
  }
}
