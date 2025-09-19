import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { QuestionDoc } from '@/types/library';

interface TriviaDatabase extends DBSchema {
  questions: {
    key: string;
    value: QuestionDoc;
    indexes: {
      by_category: QuestionDoc['category'];
      by_cat_diff: [QuestionDoc['category'], QuestionDoc['difficulty']];
      by_hash: QuestionDoc['stemHash'];
    };
  };
}

let dbPromise: Promise<IDBPDatabase<TriviaDatabase>> | null = null;

export function getDB(): Promise<IDBPDatabase<TriviaDatabase>> {
  if (!dbPromise) {
    dbPromise = openDB<TriviaDatabase>('tsa', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('questions')) {
          const store = db.createObjectStore('questions', { keyPath: 'id' });
          store.createIndex('by_category', 'category');
          store.createIndex('by_cat_diff', ['category', 'difficulty']);
          store.createIndex('by_hash', 'stemHash', { unique: true });
        }
      },
    });
  }
  return dbPromise;
}
