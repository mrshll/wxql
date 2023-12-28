import * as ohm from "https://unpkg.com/ohm-js@17/index.mjs";
import { Node } from "https://unpkg.com/ohm-js@17/index.d.ts";
import convert from "https://unpkg.com/convert";
import D, { Data, DataMeta } from "./data.ts";
import { lessThan } from "./filters.ts";
import { greaterThan } from "./filters.ts";
import { eq } from "./filters.ts";
import { nEq } from "./filters.ts";

type QueryResult = QueryResultSuccess | QueryResultFailed;

type QueryResultSuccess = {
  status: "succeeded";
  results: any[];
};

type QueryResultFailed = {
  status: "failed";
  reason: string;
};

type EvalArgs = {
  data: Data;
  source: string;
};

function getVarIndex(varStr: string, meta: DataMeta): number {
  return meta.findIndex((m) => m.name == varStr);
}

const Q = ohm.grammar(await Deno.readTextFile("./queryGrammar.ohm"));

const S = Q.createSemantics();
S.addOperation("eval(data, source)", {
  Exp(
    _: Node,
    variablesNode: Node,
    aggregatorNode: Node,
    temporalFilterNode: Node,
    predicateFilterNode: Node,
    sourceFilterNode: Node,
  ) {
    const args: EvalArgs = this.args;
    const source = sourceFilterNode.eval(args.data, null) as string;

    const vars = variablesNode.eval(args.data, source) as string[];
    const varIndeces = vars.map((v) => getVarIndex(v, args.data[source].meta));

    const [startDate, endDate] = temporalFilterNode.eval(args.data, source) as [
      Date,
      Date,
    ];
    let startIndex = 0, endIndex;
    if (startDate) {
      startIndex = args.data[source].dateLookup[startDate.toISOString()];
    }

    if (endDate) {
      endIndex = args.data[source].dateLookup[endDate.toISOString()];
    }

    const predicateFilterFn = predicateFilterNode.child(0)?.eval(
      args.data,
      source,
    );

    let results = [];
    for (
      let i = startIndex;
      i < (endIndex || args.data[source].observations.length);
      i++
    ) {
      if (
        !predicateFilterFn ||
        predicateFilterFn(args.data[source].observations[i])
      ) {
        results.push(
          varIndeces.map((vI) => args.data[source].observations[i][vI]),
        );
      }
    }
    return results;
  },

  Variables_vars(vars: Node) {
    const args: EvalArgs = this.args;
    const availableSourceVariables = args.data[args.source].meta.map(
      (m) => m.name,
    );
    return vars.asIteration().children.map((v) => {
      const varStr = v.eval(args.data, args.source);
      if (!availableSourceVariables.includes(varStr)) {
        throw new Error(`Invalid variable ${varStr} for source`);
      }
      return varStr;
    });
  },

  variable(v: Node) {
    return v.sourceString;
  },

  TemporalFilter_past_absolute(_: Node, date: Node) {
    return [new Date(date.sourceString)];
  },

  SourceFilter(_: Node, s: Node): string {
    const args: EvalArgs = this.args;
    const sStr = s.sourceString;
    if (!Object.keys(args.data).includes(sStr)) {
      throw new Error(`Invalid source ${sStr}`);
    }

    return sStr;
  },

  PredicateFilter(
    _where: Node,
    vNode: Node,
    _is: Node,
    opNode: Node,
    predicateValueNode: Node,
  ) {
    const args: EvalArgs = this.args;

    const op = opNode.sourceString;
    let opFn = greaterThan;
    const variable = vNode.eval(args.data, args.source);
    const variableIndex = getVarIndex(variable, args.data[args.source].meta);
    const srcUnit = args.data[args.source].meta[variableIndex].unit;

    let { value: predValue, unit: predUnit } = predicateValueNode.eval(
      args.data,
      args.source,
    );
    if (srcUnit != predUnit) {
      predValue = convert(predValue, predUnit).to(srcUnit);
      predUnit = srcUnit;
    }

    if (op == "below" || op == "less than") {
      opFn = lessThan;
    } else if (op == "equal") {
      opFn = eq;
    } else if (op == "not equal") {
      opFn = nEq;
    }
    return (row: (number)[]) => {
      return opFn(row[variableIndex], predValue);
    };
  },

  value(num: Node, _: Node, unit: Node): { value: number; unit: string } {
    return { value: parseFloat(num.sourceString), unit: unit.sourceString };
  },
});

export default function query(queryString: string): QueryResult {
  const m = Q.match(queryString);
  if (m.failed()) {
    return { status: "failed", reason: m.message };
  }

  return { status: "succeeded", results: S(m).eval(D, null) };
}

if (import.meta.main) {
  const decoder = new TextDecoder();
  for await (const chunk of Deno.stdin.readable) {
    const queryString = decoder.decode(chunk);
    if (queryString) {
      const resp = query(queryString);
      if (resp.status == "succeeded") {
        console.log(resp.results);
      } else {
        console.log(`Query failed: ${resp.reason}`);
      }
    }
  }
}
