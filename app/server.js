import express from 'express';
import dotenvx from '@dotenvx/dotenvx';

dotenvx.config({ path: '.env.development' });

const app = express();

