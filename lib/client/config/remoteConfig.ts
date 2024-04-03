import { writeFileSync } from 'fs';
import { makeRequestToDownstream } from '../../common/http/request';
import { PostFilterPreparedRequest } from '../../common/relay/prepareRequest';
import { ClientOpts } from '../../common/types/options';

export const retrieveConnectionsForDeployment = async (
  clientOpts: ClientOpts,
) => {
  try {
    const installId = clientOpts.config.installId;
    const deploymentId = clientOpts.config.deploymentId;
    const apiVersion = clientOpts.config.apiVersion;
    const request: PostFilterPreparedRequest = {
      url: `${clientOpts.config.API_BASE_URL}/rest/brokers/installs/${installId}/deployments/${deploymentId}/connections?version=${apiVersion}`,
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${clientOpts.accessToken}`,
      },
      method: 'GET',
    };
    const connectionsResponse = await makeRequestToDownstream(request);
    if (connectionsResponse.statusCode != 200) {
      const errorBody = JSON.parse(connectionsResponse.body);
      throw new Error(
        `${connectionsResponse.statusCode}-${errorBody.error}:${errorBody.error_description}`,
      );
    }
    const connections = JSON.parse(connectionsResponse.body).data;
    writeFileSync(
      `${__dirname}/../../../config.local.json`,
      JSON.stringify(connections),
    );
  } catch (err) {
    throw new Error(
      `${err} - Error retrieving and loading connections from Deployment ID`,
    );
  }
};
