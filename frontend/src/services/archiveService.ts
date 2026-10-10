import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SurveySessionRecord } from '../types/archive';

interface SurveyDbSchema extends DBSchema {
  sessions: {
    key: string;
    value: SurveySessionRecord;
    indexes: {
      'by-date': string;
      'by-status': string;
    };
  };
}

const DB_NAME = 'anveshaa_airborne_survey_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SurveyDbSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<SurveyDbSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<SurveyDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const store = db.createObjectStore('sessions', { keyPath: 'id' });
          store.createIndex('by-date', 'createdAt');
          store.createIndex('by-status', 'status');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveSurveySession(session: SurveySessionRecord): Promise<void> {
  const db = await getDb();
  await db.put('sessions', session);
}

export async function getAllSurveySessions(): Promise<SurveySessionRecord[]> {
  const db = await getDb();
  const sessions = await db.getAllFromIndex('sessions', 'by-date');
  return sessions.reverse(); // newest first
}

export async function getSurveySessionById(id: string): Promise<SurveySessionRecord | undefined> {
  const db = await getDb();
  return db.get('sessions', id);
}

export async function deleteSurveySession(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('sessions', id);
}

export async function updateSurveySessionName(id: string, newName: string): Promise<void> {
  const db = await getDb();
  const session = await db.get('sessions', id);
  if (session) {
    session.missionName = newName;
    await db.put('sessions', session);
  }
}
