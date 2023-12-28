import { assert } from "https://deno.land/std@0.210.0/assert/mod.ts";
import query from "./wxql.ts";

[
  "show temperature since 2019-01-01 from sensor-1234",
  "show temperature and precipitation since 2019-01-01 from sensor-1234",
  "show precipitation since 2022-01-01 from sensor-1234",
  "show timestamp and precipitation since 2019-01-01 where precipitation was greater than 0 mm from sensor-1234",
  "show timestamp and temperature since 2019-01-01 where temperature was greater than 67 F from sensor-1234",
  "show timestamp, temperature since 2019-01-01 where temperature was greater than 67 F from sensor-1234",
  // "show days in the last 5 years where temperature was below 0 F from sensor-1234",
  // "show precipitation and temperature aggregated daily in the latest forecasts from ecmwf-hres and noaa-gefs",
].forEach((q) => {
  Deno.test(q, () => {
    const queryResult = query(q);
    const s = queryResult.status == "succeeded";
    if (!s) {
      console.log(queryResult.reason);
    } else {
      console.log(queryResult.results);
    }
    assert(s);
  });
});
