import { existsSync, rmSync } from 'fs';
import { retrieveConnectionsForDeployment } from '../../lib/client/config/remoteConfig';
import { getConfig, loadBrokerConfig } from '../../lib/common/config/config';
import { ClientOpts } from '../../lib/common/types/options';
const nock = require('nock');

describe('Remote config helpers', () => {
  const localCfgFile = `${__dirname}/../../config.local.json`;
  beforeAll(() => {
    if (existsSync(localCfgFile)) {
      console.log('Cleaning up config.local.json pre test');
      rmSync(localCfgFile);
    }
    nock('http://restapihostname')
      .persist()
      .get(
        `/rest/brokers/installs/12345/deployments/67890/connections?version=2024-04-02~experimental`,
      )
      .reply(() => {
        return [
          200,
          {
            data: {
              CONNECTIONS: {
                'my github connection': {
                  type: 'github',
                  identifier: 'BROKER_TOKEN_1',
                  GITHUB_TOKEN: 'GITHUB_TOKEN_XYZ',
                },
              },
            },
          },
        ];
      });
  });
  beforeEach(() => {});
  afterAll(() => {
    rmSync(localCfgFile);
  });
  afterEach(() => {});
  it('Retrieve connections from install ID and deployment ID', async () => {
    loadBrokerConfig();
    let config = getConfig();

    const installId = '12345';
    const deploymentId = '67890';
    const apiVersion = '2024-04-02~experimental';
    const apiBaseUrl = 'http://restapihostname';
    config.installId = installId;
    config.deploymentId = deploymentId;
    config.apiVersion = apiVersion;
    config.API_BASE_URL = apiBaseUrl;

    const clientOps: ClientOpts = {
      port: 0,
      config,
      filters: { public: [], private: [] },
    };
    await retrieveConnectionsForDeployment(clientOps);
    loadBrokerConfig();
    config = getConfig();
    expect(config.connections).toEqual({
      'my github connection': {
        GITHUB_TOKEN: 'GITHUB_TOKEN_XYZ',
        identifier: 'BROKER_TOKEN_1',
        type: 'github',
      },
    });
  });
});
