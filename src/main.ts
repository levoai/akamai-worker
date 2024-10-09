import { logger } from 'log';
import { httpRequest } from 'http-request';

const supportedMimeTypes = [
  "application/json",
  "application/ld+json",
  "text/json",
  "application/x-www-form-urlencoded",
  "application/grpc",
  "multipart/form-data",
  "application/xml",
  "text/xml",
  "text/plain",
];

const responseHeaderNames = [
  'Content-Type',
  'Content-Length',
  'Cache-Control',
  'Expires',
  'Last-Modified',
  'ETag',
  'Location',
  'Server',
  'Set-Cookie',
  'X-Frame-Options',
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'X-XSS-Protection'
];

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper function for log sampling
const shouldLogError = (sampleRate = 0.1) => {
  return Math.random() < sampleRate; // 10% chance to log by default
};

// Only report request/response pairs for supported response MIME types
const shouldSendToLevo = (request, response) => {
  const contentType = response.getHeader('Content-Type')?.[0]?.toLowerCase();
  if (!contentType) {
    logger.debug(
        `The response from the server for the URL "${request.url}" ` +
        "was missing the Content-Type header or it had an empty value. " +
        "Sending to Levo anyway since it might be an API endpoint."
    );
    return true;
  }
  return supportedMimeTypes.some((t) => contentType.includes(t));
};

export async function onClientResponse(request, response) {

  try {
    if (!shouldSendToLevo(request, response)) {
      logger.debug(`Skipping sending traces for URL ${request.url} to Levo.`);
      return response;
    }

    // TODO: Check if we need the following checks
    const levoOrgId = request.getVariable('PMUSER_LEVO_ORG_ID');
    if (!levoOrgId) {
      logger.warn("PMUSER_LEVO_ORG_ID not set, skipping");
      return response;
    }

    const levoSatelliteUrl = request.getVariable('PMUSER_LEVO_SATELLITE_URL');
    if (!levoSatelliteUrl) {
      logger.warn("PMUSER_LEVO_SATELLITE_URL not set, skipping");
      return response;
    }

    // Capture request details
    const requestDetails = {
      host: request.host,
      scheme: request.scheme,
      method: request.method,
      path: request.path,
      url: request.url,
      query: request.query,
      headers: request.getHeaders(),
      body: request.body
    };

    // Capture response details
    const responseDetails = {
      status: response.status,
      headers: {}
    };

    responseHeaderNames.forEach((responseHeaderName) => {
      const headerValues = response.getHeader(responseHeaderName);
      if (headerValues) responseDetails.headers[responseHeaderName] = headerValues;
    });

    // Combine request and response details
    const logData = {
      request: requestDetails,
      response: responseDetails,
      timestamp: new Date().toISOString(),
      requestId: generateUUID(),
      serviceName: request.getVariable('PMUSER_LEVO_SERVICE_NAME') || '',
      env: request.getVariable('PMUSER_LEVO_ENV') || 'staging'
    };

    try {
      const levo_satellite_endpoint = `${levoSatelliteUrl}${levoSatelliteUrl.charAt(levoSatelliteUrl.length - 1) === "/"
          ? "" : "/" }v1/edgeworker-event`;

      const logResponse = await httpRequest(`${levo_satellite_endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "x-levo-organization-id": levoOrgId,
        },
        body: JSON.stringify(logData)
      });

      logger.debug('Log data sent. Status: ' + logResponse.status);
    } catch (error) {
      // Sampling error logging
      if (shouldLogError()) {
        logger.error('Error sending log data: ' + (error as Error).toString());
      }
    }

  } catch (error) {
    // Sampling error logging
    if (shouldLogError()) {
      logger.error('Error in onClientResponse: ' + (error as Error).toString());
    }
  }
  return response;
}
