import * as ohm from 'https://cdn.skypack.dev/ohm-js';

const queryGrammar = ohm.grammar(await Deno.readTextFile('./queryGrammar.ohm'));

const userInput = 'show precipitation and temperature in the last 10 days';
const m = queryGrammar.match(userInput);
if (m.succeeded()) {
  console.log('valid query');
} else {
  console.log('invalid query');
}
