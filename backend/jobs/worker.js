import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { analyzeWorkflow } from '../repository-analyzer/cicdValidator.js';
import { VCSFactory } from '../vcs/VCSFactory.js';
import { batchStore, redisAvailable } from './queue.js';

let auditWorker = null;
const conn = redisAvailable
  ? new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: null,
    })
  : null;

if (conn) {
  auditWorker = new Worker('bulk-audit-queue', async (job) => {
    const { batchId, repoUrl } = job.data;

    let parsedRepoUrl;
    try {
      parsedRepoUrl = new URL(repoUrl);
    } catch {
      throw new Error("Invalid GitHub URL");
    }

    if (
      !['http:', 'https:'].includes(parsedRepoUrl.protocol) ||
      !['github.com', 'www.github.com'].includes(parsedRepoUrl.hostname.toLowerCase())
    ) {
      throw new Error("Invalid GitHub URL");
    }

    try {
      const provider = VCSFactory.getProvider(repoUrl);
      const workflows = await provider.getNormalizedWorkflows();

      let bestScore = 0;
      for (const wf of workflows) {
        const result = analyzeWorkflow(wf.commands);
        if (result.score > bestScore) bestScore = result.score;
      }

      return { repoUrl, score: bestScore };
    } catch (error) {
      console.error(`Job ${job.id} failed for repo ${repoUrl}:`, error.message);
      throw error;
    }
  }, {
    connection: conn,
    concurrency: 5,
  });

  auditWorker.on('error', (err) => {
    console.warn('Worker Redis Connection Error:', err.message);
  });

  auditWorker.on('completed', (job, result) => {
    const { batchId } = job.data;
    const batch = batchStore.get(batchId);
    if (batch) {
      batch.completed += 1;
      batch.results.push(result);
    }
  });

  auditWorker.on('failed', (job, err) => {
    const { batchId } = job.data;
    const batch = batchStore.get(batchId);
    if (batch) {
      batch.failed += 1;
      batch.results.push({ repoUrl: job.data.repoUrl, error: err.message, score: 0 });
    }
  });

  console.log('Background Audit Worker started and listening for jobs...');
}


