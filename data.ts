export type DataMeta = { name: string; type: string; unit?: string }[];
export type Data = {
  [key: string]: {
    meta: DataMeta;
    dateLookup: { [key: string]: number };
    observations: (string | number)[][];
  };
};
const data: Data = {
  "sensor-1234": {
    meta: [{ name: "timestamp", type: "datetime" }, {
      "name": "temperature",
      type: "number",
      unit: "C",
    }, {
      "name": "precipitation",
      type: "number",
      unit: "mm",
    }],
    dateLookup: {
      "2019-01-01T00:00:00.000Z": 0,
      "2020-01-01T00:00:00.000Z": 1,
      "2021-01-01T00:00:00.000Z": 2,
      "2022-01-01T00:00:00.000Z": 3,
      "2023-01-01T00:00:00.000Z": 4,
      "2024-01-01T00:00:00.000Z": 5,
    },
    observations: [
      [
        "2019-01-01T00:00:00.000Z",
        -10,
        0,
      ],
      ["2020-01-01T00:00:00.000Z", -4, 0],
      ["2021-01-01T00:00:00.000Z", 0, 0],
      [
        "2022-01-01T00:00:00.000Z",
        30,
        1,
      ],
      ["2023-01-01T00:00:00.000Z", 20, 2],
      ["2024-01-01T00:00:00.000Z", 2, 0],
    ],
  },
};

export default data;
