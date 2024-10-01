# Uniform Akamai EdgeWorker

See docs [here](https://docs.levo.ai/).

## Getting Started
1. Ensure you have [Akamai CLI installed](https://techdocs.akamai.com/edgeworkers/docs/akamai-cli)
    - On Windows you may need to add `akamai.exe` location to `Path` environment variable
2. Ensure you have [Akamai API credentials](https://techdocs.akamai.com/developer/docs/set-up-authentication-credentials) file
3. Install edgeworkers command with `akamai install edgeworkers`
4. Ensure you have [EdgeWorker](https://control.akamai.com/apps/edgeworkers/#/edgeworkers) created
5. Copy `.env.example` to `.env`
6. Configure environment variables:
    - `AKAMAI_WORKER_ID`
    - `AKAMAI_WORKER_NETWORK`
    - `AKAMAI_WORKER_VERSION_INCREMENT` (optional)

`\src\bundle.json` contains bundle metadata

use `yarn worker:version:prepare` command to increment version and prepare dist

use `yarn worker:version:deploy` command to upload and activate bundle

Akamai EdgeWorkers [documentation](https://techdocs.akamai.com/edgeworkers/docs/welcome-to-edgeworkers) 