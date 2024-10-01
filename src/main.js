import { logger } from 'log';
import { httpRequest } from 'http-request';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

let errorLogCount = 0;
let lastResetTime = Date.now();

// Helper function for rate limiting (e.g., 5 logs per minute)
function canLogError(maxLogsPerMinute = 5) {
  const now = Date.now();
  if (now - lastResetTime > 60000) { // Reset counter every 60 seconds
    errorLogCount = 0;
    lastResetTime = now;
  }
  if (errorLogCount < maxLogsPerMinute) {
    errorLogCount++;
    return true;
  }
  return false;
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
      requestId: generateUUID(),
      serviceName: request.getVariable('PMUSER_SERVICE_NAME'),
      env: request.getVariable('PMUSER_ENVIRONMENT')
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

      logger.debug('Log data sent. Status: ' + logResponse.status);
    } catch (error) {
      // Rate-limit error logging to avoid flooding (5 errors per minute)
      if (canLogError(5)) {
        logger.error('Error sending log data: ' + error.toString());
      }
    }

  } catch (error) {
    // Rate-limit error logging to avoid flooding (5 errors per minute)
    if (canLogError(5)) {
      logger.error('Error in onClientResponse: ' + error.toString());
    }
  }
  return response;
}
