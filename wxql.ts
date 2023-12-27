import * as ohm from "https://deno.land/x/ohm_js@v17.1.0/index.mjs";
import { type Node } from "https://deno.land/x/ohm_js@v17.1.0/index.d.ts";

type QueryResult = QueryResultSuccess | QueryResultFailed;

type QueryResultSuccess = {
  status: "succeeded";
};

type QueryResultFailed = {
  status: "failed";
  reason: string;
};

const Q = ohm.grammar(await Deno.readTextFile("./queryGrammar.ohm"));

const S = Q.createSemantics();
S.addOperation("eval", {
  Exp(
    _: Node,
    variables: Node,
    aggregator: Node,
    temporalFilter: Node,
    predicateFilter: Node,
    sourceFilter: Node,
  ) {
    variables.eval();
    return;
  },

  Variables(vs: Node) {
    vs.children.forEach((v) => {
      v.eval();
    });
  },

  variable(v: Node) {
    console.log(v.sourceString);
  },

  value(num: Node, _: Node, unit: Node) {
    console.log(num.sourceString, unit.sourceString);
  },
});

export default function query(queryString: string): QueryResult {
  const m = Q.match(queryString);
  if (m.failed()) {
    return { status: "failed", reason: m.message };
  }

  S(m).eval();
  return { status: "succeeded" };
}
