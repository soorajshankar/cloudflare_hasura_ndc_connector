## Setup

Install deps

```sh
yarn
```

To run locally

```sh
yarn dev
```

Before publishing your code you need to edit `wrangler.toml` file and add your Cloudflare `account_id` - more information about configuring and publishing your code can be found [in the documentation](https://developers.cloudflare.com/workers/learning/getting-started).

Once you are ready, you can publish your code by running the following command:

```sh
$ npm run deploy
# or
$ yarn run deploy
# or
$ pnpm run deploy
```
