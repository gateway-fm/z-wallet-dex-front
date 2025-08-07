import { GraphQLClient } from "graphql-request";
import { Route } from "../types";

/// GRAPH-QL ///

const subGraphUrl = "http://52.47.200.90:8000/subgraphs/name/v3-mainnet";
const poolsReq = `
    query PoolsQuery {
    pools(where: {liquidity_gt: "0"}) {
      token0 { id }
      token1 { id }
      feeTier
    }
  }
`;
const client = new GraphQLClient(subGraphUrl);

interface Pool {
  token0: { id: string };
  token1: { id: string };
  feeTier: string;
}

interface PoolsResponse {
  pools: Pool[];
}

/// CONFIGS ///
const MAX_HOPS = 4;

export async function getAllRoutes(tokenIn: string, tokenOut: string): Promise<Route[]> {
  /* 1. Load pools and build an adjacency list */
  const { pools } = await client.request<PoolsResponse>(poolsReq);

  type Edge = { next: string; fee: number };
  const adj: Map<string, Edge[]> = new Map();

  for (const p of pools) {
    const a = p.token0.id;
    const b = p.token1.id;
    const fee = Number(p.feeTier);
    adj.set(a, [...(adj.get(a) ?? []), { next: b, fee }]);
    adj.set(b, [...(adj.get(b) ?? []), { next: a, fee }]); // undirected graph
  }

  /* 2. DFS with depth cutoff */
  const routes: Route[] = [];

  type Frame = {
    current: string;
    path: Route; // built hops so far
    visited: Set<string>;
  };

  const stack: Frame[] = [{ current: tokenIn, path: [], visited: new Set([tokenIn]) }];

  while (stack.length) {
    const f = stack.pop()!;
    // If target reached and at least one hop exists — save the route
    if (f.current === tokenOut && f.path.length) {
      routes.push(f.path);
    }
    if (f.path.length >= MAX_HOPS) continue;

    for (const { next, fee } of adj.get(f.current) ?? []) {
      if (f.visited.has(next)) continue; // avoid cycles
      stack.push({
        current: next,
        path: [...f.path, { tokenIn: f.current, tokenOut: next, fee }],
        visited: new Set(f.visited).add(next),
      });
    }
  }

  /* 3. Deduplication: unique by (tokenIn-tokenOut-fee) sequence */
  const seen = new Set<string>();
  return routes
    .filter(r => r.length > 0)
    .filter(r => {
      const key = r.map(p => `${p.tokenIn}-${p.tokenOut}-${p.fee}`).join("|");
      return seen.has(key) ? false : seen.add(key);
    });
}
