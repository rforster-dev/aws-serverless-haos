/**
 * Javascript file to be ran in aws lambda to allow
 * Home Assistant devices to be exposed to Alexa
 * Its an alternative to using the python script provided
 * @see https://www.home-assistant.io/integrations/alexa.smart_home
 */

import https from "https";
import url from "url";

const debug = process.env.DEBUG === "TRUE";
const logger = debug ? console.debug : console.info;

export async function handler(event) {
  logger("Event:", JSON.stringify(event, null, 2));

  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error("Please set BASE_URL environment variable");
  }

  const directive = event.directive;
  if (!directive) {
    throw new Error("Malformatted request - missing directive");
  }

  if (directive.header.payloadVersion !== "3") {
    throw new Error("Only support payloadVersion == 3");
  }

  let scope =
    directive.endpoint?.scope ||
    directive.payload?.grantee ||
    directive.payload?.scope;
  if (!scope) {
    throw new Error("Malformatted request - missing endpoint.scope");
  }

  if (scope.type !== "BearerToken") {
    throw new Error("Only support BearerToken");
  }

  let token = scope.token;
  if (!token && debug) {
    token = process.env.LONG_LIVED_ACCESS_TOKEN; // only for debug purpose
  }

  if (!token) {
    throw new Error("Authorization token is missing or invalid");
  }

  const verifySsl = process.env.NOT_VERIFY_SSL !== "true";

  const parsedUrl = url.parse(
    `${baseUrl.replace(/\/+$/, "")}/api/alexa/smart_home`
  );
  const requestOptions = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 443, // Default to port 443 for HTTPS
    path: parsedUrl.path,
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    rejectUnauthorized: verifySsl,
    timeout: 12000, // 2 seconds connect timeout + 10 seconds read timeout
  };

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      let responseBody = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        logger("Response Status:", res.statusCode);
        logger("Response Body:", responseBody);

        if (res.statusCode >= 400) {
          const errorResponse = {
            event: {
              payload: {
                type:
                  res.statusCode === 401 || res.statusCode === 403
                    ? "INVALID_AUTHORIZATION_CREDENTIAL"
                    : "INTERNAL_ERROR",
                message: `${res.statusCode}: ${responseBody}`,
              },
            },
          };
          resolve(errorResponse);
        } else {
          try {
            resolve(JSON.parse(responseBody));
          } catch (error) {
            resolve({
              event: {
                payload: {
                  type: "INTERNAL_ERROR",
                  message: `Failed to parse response: ${responseBody}`,
                },
              },
            });
          }
        }
      });
    });

    req.on("error", (e) => {
      logger("Request Error:", e.message);
      reject({
        event: {
          payload: {
            type: "INTERNAL_ERROR",
            message: `Request failed: ${e.message}`,
          },
        },
      });
    });

    req.write(JSON.stringify(event));
    req.end();
  });
}
