import * as ohm from "https://deno.land/x/ohm_js@v17.1.0/index.mjs";
import { type Node } from "https://deno.land/x/ohm_js@v17.1.0/index.d.ts";
import data from "./data.ts";

type QueryResult = QueryResultSuccess | QueryResultFailed;

type QueryResultSuccess = {
  status: "succeeded";
  results: any[];
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
    const source = sourceFilter.eval() as string;

    const availableSourceVariables = data[source].meta.map((m) => m.name);
    const vars = variables.eval() as string[];
    vars.forEach((v) => {
      if (!availableSourceVariables.includes(v)) {
        throw new Error(`Invalid variable ${v} for source`);
      }
    });
    const varIndeces = vars.map((v) =>
      data[source].meta.findIndex((m) => m.name == v)
    );

    const [startDate, endDate] = temporalFilter.eval() as [Date, Date];
    let startIndex = 0, endIndex;
    if (startDate) {
      startIndex = data[source].dateLookup[startDate.toISOString()];
    }

    if (endDate) {
      endIndex = data[source].dateLookup[endDate.toISOString()];
    }

    let results = [];
    for (
      let i = startIndex;
      i < (endIndex || data[source].observations.length);
      i++
    ) {
      results.push(varIndeces.map((vI) => data[source].observations[i][vI]));
    }
    return results;
  },

  Variables_vars(vars: Node) {
    return vars.asIteration().children.map((c) => {
      return c.eval();
    });
  },

  variable(v: Node) {
    return v.sourceString;
  },

  TemporalFilter_past_absolute(_: Node, date: Node) {
    return [new Date(date.sourceString)];
  },

  SourceFilter(_: Node, s: Node): string {
    const sStr = s.sourceString;
    if (!Object.keys(data).includes(sStr)) {
      throw new Error(`Invalid source ${sStr}`);
    }

    return sStr;
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

  return { status: "succeeded", results: S(m).eval() };
}
