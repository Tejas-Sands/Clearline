# Graph extraction diagnostics

```text
[graphify] MultiDiGraph edge-collapse diagnostic
input: <in-memory>
input_stage: provided JSON (normal graph.json is post-build)
effective_directed: <direct-call>
nodes: 325
unverified_code_nodes: 0
raw_edges: 749
valid_candidate_edges: 711
missing_endpoint_edges: 0
dangling_endpoint_edges: 1
external_reference_edges: 37
self_loop_edges: 1
exact_duplicate_edges: 0
directed_unique_endpoint_pairs: 673
directed_same_endpoint_collapsed_edges: 38
undirected_unique_endpoint_pairs: 672
undirected_same_endpoint_collapsed_edges: 39
same_endpoint_group_count: 38
relation_variant_groups: 23
source_file_variant_groups: 0
source_location_variant_groups: 15
context_variant_groups: 0
post_build_graph_type: DiGraph
post_build_edges: 711
producer_suppression_sites: 12
producer_suppression_examples:
  - L1337 seen_ids arity=unknown
  - L1870 seen_ids arity=unknown
  - L1872 seen_doc_refs arity=unknown
  - L2242 seen_ids arity=unknown
  - L2389 seen_ids arity=unknown
  - L3109 seen_keys arity=unknown
  - L3278 seen_keys arity=unknown
  - L5334 seen_ids arity=unknown
examples:
  - scripts_dev -> scripts_dev_stop edges=2 relations=['calls', 'contains'] locations=['L7', 'L8'] contexts=['', 'call']
  - server_chain_makechain -> server_chain_makechain_finishswap edges=2 relations=['contains', 'indirect_call'] locations=['L102', 'L215'] contexts=['', 'collection']
  - server_chain_makechain -> server_chain_makechain_finishpay edges=2 relations=['contains', 'indirect_call'] locations=['L127', 'L221'] contexts=['', 'collection']
  - server_chain_makechain -> server_chain_makechain_bridge edges=2 relations=['contains', 'indirect_call'] locations=['L134', 'L221'] contexts=['', 'collection']
  - server_chain_makechain -> server_chain_makechain_recoverbridge edges=2 relations=['contains', 'indirect_call'] locations=['L147', 'L221'] contexts=['', 'collection']
note: normal graph.json is post-build; raw producer loss must be measured earlier.
```

Full parallel-edge evidence is retained in `extraction.json`. External import targets are represented by Graphify stubs; unresolved/static-analysis edges must be checked against source.
