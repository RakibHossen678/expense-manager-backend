import morgan from 'morgan';
import { env } from '../config/env.js';

// Concise colored output in dev, standard Apache-style combined log in prod
export const requestLogger = morgan(env.IS_PRODUCTION ? 'combined' : 'dev');
