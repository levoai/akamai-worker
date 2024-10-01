import { logger } from 'log';
import { httpRequest } from 'http-request';
import { createResponse } from 'create-response';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function onClientResponse(request, response) {

  try {
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
      headers: {
        'Content-Type': response.getHeader('Content-Type') || '',
        'Content-Length': response.getHeader('Content-Length') || '',
        'Cache-Control': response.getHeader('Cache-Control') || '',
        'Expires': response.getHeader('Expires') || '',
        'Last-Modified': response.getHeader('Last-Modified') || '',
        'ETag': response.getHeader('ETag') || '',
        'Location': response.getHeader('Location') || '',
        'Server': response.getHeader('Server') || '',
        'Set-Cookie': response.getHeader('Set-Cookie') || '',
        'X-Frame-Options': response.getHeader('X-Frame-Options') || '',
        'Strict-Transport-Security': response.getHeader('Strict-Transport-Security') || '',
        'X-Content-Type-Options': response.getHeader('X-Content-Type-Options') || '',
        'X-XSS-Protection': response.getHeader('X-XSS-Protection') || ''
      }
    };

    // Combine request and response details
    const logData = {
      request: requestDetails,
      response: responseDetails,
      timestamp: new Date().toISOString(),
      requestId: generateUUID()
    };

    const logEndpoint = 'http://echo.getlevoai.com/traces';

    try {
      const logResponse = await httpRequest(`${logEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      });

      logger.info('Log data sent. Status: ' + logResponse.status);
    } catch (error) {
      logger.error('Error sending log data: ' + error.toString());
    }

    return response;
  } catch (error) {
    logger.error('Error in onClientResponse: ' + error.toString());
    return createResponse(500, {}, 'Internal Server Error');
  }
}
