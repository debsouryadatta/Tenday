import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
const crons = cronJobs();
crons.interval('Expire unconfirmed uploads and temporary AI jobs', { hours: 6 }, internal.files.expire, {});
export default crons;
