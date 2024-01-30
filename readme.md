# Relay-RSC Project

## Overview

Relay-RSC is an early-stage alpha library developed to integrate Relay with React Server Components.

## Key Features

- **Fragment Suspension Support**: Allows fragments in components to suspend, offering improved control over data loading and rendering.
- **Alpha Stage Development**: Being in its initial development phase, the project is open to contributions and suggestions for enhancements.

## RSC Only

Currently the library only supports React Server Components. Serializing parts of the relay-component tree to be rendered on the server/client is not supported. Client components work as long as they don't receive any relay data from the RSC environment. In the future, we plan to add support for serializing the relay-component tree.

## Installation

```bash
npm install relay-rsc
# or
yarn add relay-rsc
```

# Usage

```tsx
import { readQuery } from "relay-rsc";

async function HomePage() {
  const data = await readQuery(
    graphql`
      query HomePageQuery {
        viewer {
          id
          ...HomeFragment
        }
      }
    `,
    {},
    getCurrentEnvironment()
  );
  return (
    <div>
      Viewer {data.viewer.id}
      <Home viewer={data.viewer} />
    </div>
  );
}

async function Home(props) {
  const data = await readFragment(
    graphql`
      fragment HomeFragment on Viewer {
        id
      }
    `,
    props.viewer,
    getCurrentEnvironment()
  );

  return <div>Home {data.id}</div>;
}
```

## Providing The Relay Environment

You need a way to provide the Relay Environment to the library. You can do this like the following example:

Note that the `getCurrentEnvironment` function is cached using `react/cache` to ensure that the same environment is used across the entire application.

```tsx
import { Environment, Network, RecordSource, Store } from "relay-runtime";
import { cache } from "react";

const BACKEND_URL = process.env.BACKEND_URL;
export const getCurrentEnvironment = cache(function getCurrentEnvironment() {
  const store = new Store(new RecordSource());
  const network = Network.create(async ({ id, name, text }, variables) => {
    if (!BACKEND_URL) throw new Error("BACKEND_URL is not set");
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: id ?? text,
        variables,
      }),
    });

    const json = await response.json();
    return json;
  });
  return new Environment({
    network,
    store,
    isServer: false,
  });
});
```
