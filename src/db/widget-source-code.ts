import { Entity } from 'dexie';

import type AppDB from './app-db';

export class WidgetSourceCode extends Entity<AppDB> {
  id!: number;
  label!: string;
  content!: string;
}
