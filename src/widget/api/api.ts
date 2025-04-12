import type { Action } from './action';
import type { Environment } from './environment';

import type AppDB from '@/db/app-db';

export interface API {
  env: Environment;
  db: AppDB;
  action: Action;
}
