import {
  ArrayKeyType,
  ArrayKeyTypeData,
  KeyType,
  KeyTypeData,
} from "react-relay/relay-hooks/helpers";

import {
  Environment,
  GraphQLTaggedNode,
  getSingularSelector,
  getPluralSelector,
  getFragment,
  getPendingOperationsForFragment,
  VariablesOf,
  OperationType,
  createOperationDescriptor,
  ConcreteRequest,
} from "relay-runtime";
import { fetchQuery } from "relay-runtime/lib/query/fetchQueryInternal";

export function readFragment<TKey extends KeyType>(
  fragmentInput: GraphQLTaggedNode,
  fragmentRef: TKey,
  environment: Environment
): Promise<KeyTypeData<TKey>>;

export function readFragment<TKey extends KeyType>(
  fragmentInput: GraphQLTaggedNode,
  fragmentRef: TKey | null | undefined,
  environment: Environment
): Promise<KeyTypeData<TKey> | null | undefined>;

export function readFragment<TKey extends ArrayKeyType>(
  fragmentInput: GraphQLTaggedNode,
  fragmentRef: TKey,
  environment: Environment
): Promise<ArrayKeyTypeData<TKey>>;

export function readFragment<TKey extends ArrayKeyType>(
  fragmentInput: GraphQLTaggedNode,
  fragmentRef: TKey | null | undefined,
  environment: Environment
): Promise<ArrayKeyTypeData<TKey> | null | undefined>;

export async function readFragment(
  fragmentInput: GraphQLTaggedNode,
  fragmentRef: unknown,
  environment: Environment
) {
  if (fragmentRef == null) return fragmentRef;
  const readerFragment = getFragment(fragmentInput);
  if (Array.isArray(fragmentRef)) {
    if (fragmentRef.length === 0) return fragmentRef;
    const pluralSelector = getPluralSelector(readerFragment, fragmentRef);
    const owner = pluralSelector.selectors[0].owner;

    const pendingRequest = getPendingOperationsForFragment(
      environment,
      readerFragment,
      owner
    );
    if (pendingRequest) {
      await pendingRequest.promise;
    } else {
    }
    return pluralSelector.selectors.map((s) => environment.lookup(s));
  }
  const selector = getSingularSelector(readerFragment, fragmentRef);
  const owner = selector.owner;
  const pendingPromise = getPendingOperationsForFragment(
    environment,
    readerFragment,
    owner
  );

  const { isMissingData } = environment.lookup(selector);

  if (isMissingData) {
    if (pendingPromise) {
      await pendingPromise.promise;
    } else {
      throw new Error("readFragment: missing data");
    }
  }

  const lookup = environment.lookup(selector);
  if (lookup.isMissingData) {
    throw new Error("readFragment: missing data");
  }
  return lookup.data;
}

export async function readQuery<TQuery extends OperationType>(
  query: GraphQLTaggedNode,
  variables: VariablesOf<TQuery>,
  environment: Environment
): Promise<TQuery["response"]> {
  if (typeof query === "object" && query.kind === "Request") {
    const request = query as ConcreteRequest;

    const descriptor = createOperationDescriptor(request, variables);
    fetchQuery(environment, descriptor).subscribe({});

    const pending = getPendingOperationsForFragment(
      environment,
      request.fragment,
      descriptor.request
    );

    const { isMissingData } = environment.lookup(descriptor.fragment);
    if (isMissingData) {
      if (pending) {
        await pending.promise;
      } else {
        throw new Error("readQuery: missing data");
      }
    }

    const result = environment.lookup(descriptor.fragment);

    if (result.isMissingData) {
      throw new Error("readQuery: missing data");
    }

    return result.data as TQuery["response"];
  }

  throw new Error("readQuery: query is not a ConcreteRequest");
}
