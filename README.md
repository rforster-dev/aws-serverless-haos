# Home Assistant Alexa Lambda Integration

This AWS Lambda function allows you to expose Home Assistant devices to Alexa. It's an alternative to using the Python script provided by Home Assistant link. For more details, refer to the [Home Assistant Alexa Smart Home integration documentation](https://www.home-assistant.io/integrations/alexa.smart_home).

## Features

- Handles Alexa Smart Home API requests.
- Supports payload version 3.
- Authenticates using Bearer tokens.
- Configurable SSL verification.
- Debug mode for local testing.

## Setup

### Prerequisites

- https://www.home-assistant.io/integrations/alexa.smart_home Go through this guide and when you get to the part of copying the python script, use this instead running on a Node engine.

- Node.js (version 20.x is recommended)
- AWS Lambda setup
- Alexa skill to be used

### Environment Variables

Set the following environment variables for your Lambda function:

- `BASE_URL`: The base URL for your Home Assistant instance (e.g., `https://example.com`).
- `LONG_LIVED_ACCESS_TOKEN`: A long-lived access token from Home Assistant for debugging (optional, used only if `DEBUG` is set to `TRUE`).
- `NOT_VERIFY_SSL`: Set to `"true"` to disable SSL certificate verification (default is `"false"`). Only use this for debugging purposes.
- `DEBUG`: Set to `"TRUE"` to enable debug logging.
