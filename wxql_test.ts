import { assert } from "https://deno.land/std@0.210.0/assert/mod.ts";
import query from "./wxql.ts";

[
  "show the days in the last 5 years where temperature was below 0 F from sensor-1234",
  "show the precipitation and temperature aggregated daily in the latest forecasts from ecmwf-hres and noaa-gefs",
].forEach((q) => {
  Deno.test(q, () => {
    const queryResult = query(q);
    const s = queryResult.status == "succeeded";
    if (!s) {
      console.log(queryResult.reason);
    }
    assert(s);
  });
});
