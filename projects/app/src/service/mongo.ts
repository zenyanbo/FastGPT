import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { connectMongo } from '@fastgpt/service/common/mongo/init';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { createDefaultTeam } from '@fastgpt/service/support/user/team/controller';
import { exit } from 'process';
import { initVectorStore } from '@fastgpt/service/common/vectorStore/controller';
import { getInitConfig } from '@/pages/api/common/system/getInitData';
import { startCron } from './common/system/cron';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { initGlobal } from './common/system';
import { startMongoWatch } from './common/system/volumnMongoWatch';
import { startTrainingQueue } from './core/dataset/training/utils';

/**
 * connect MongoDB and init data
 */
export function connectToDatabase(): Promise<void> {
  return connectMongo({
    beforeHook: () => {
      initGlobal();
    },
    afterHook: async () => {
      startMongoWatch();
      // cron
      startCron();
      // init system config
      getInitConfig();

      // init vector database
      await initVectorStore();
      // start queue
      startTrainingQueue(true);

      initRootUser();
    }
  });
}

async function initRootUser() {
  try {
    const rootUser = await MongoUser.findOne({
      username: 'root'
    });
    const psw = process.env.DEFAULT_ROOT_PSW || '123456';

    let rootId = rootUser?._id || '';

    await mongoSessionRun(async (session) => {
      // init root user
      if (rootUser) {
        await MongoUser.findOneAndUpdate(
          { username: 'root' },
          {
            password: hashStr(psw)
          }
        );
      } else {
        const [{ _id }] = await MongoUser.create(
          [
            {
              username: 'root',
              password: hashStr(psw)
            }
          ],
          { session }
        );
        rootId = _id;
      }
      // init root team
      await createDefaultTeam({ userId: rootId, balance: 9999 * PRICE_SCALE, session });
    });

    console.log(`root user init:`, {
      username: 'root',
      password: psw
    });
  } catch (error) {
    console.log('init root user error', error);
    exit(1);
  }
}
