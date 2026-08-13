import path                   from 'path';
import { fileURLToPath }      from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(path.dirname(__filename));


let tests = [];
let currFileTest = null;

function describe(name, fn) {
  //console.info("<<<< ", name, " >>>>");
  fn();
}

function test(name, fn) {
  tests.push({name, fn});
}

async function run() {
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    try {
      await t.fn();
      passed += 1;
      //console.info("    ", t.name);
    } catch (e) {
      failed += 1;
      console.error("    ", "Failed: ", t.name);
      console.error("    ", t.path);
      console.error("    ", e.message);
      console.error("    ", e.stack);
    }
  }

  console.info("Passed: ", passed, ", Failed: ", failed);
}


global.describe = describe;
global.it   = test;
global.test = test;

const files = process.argv.slice(2);
for (let i = 0; i < files.length; i++) {
  const it = files[i];
  const abs_path = it.startsWith('/') ? it : path.join(__dirname, it)
  const r = await import(abs_path);
}

run();

