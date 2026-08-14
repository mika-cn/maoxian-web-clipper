import path                   from 'path';
import { fileURLToPath }      from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(path.dirname(__filename));

const state = {
  currPath: "",
  currDesc: "",
  tests: [],
  index: 0,
  passed: 0,
  failed: 0,
};

function describe(name, fn) {
  state.currDesc = name;
  fn();
}

function test(name, fn) {
  state.tests.push({path: state.currPath, desc: state.currDesc, name, fn});
}

async function run() {

  for (; state.index < state.tests.length; state.index++) {
    const t = state.tests[state.index];
    try {
      await t.fn();
      state.passed += 1;
      //console.info("    ", `${t.desc}/${t.name}`);
    } catch (e) {
      state.failed += 1;
      console.error("    ", "Failed: ", `${t.desc}/${t.name}`);
      console.error("    ", t.path);
      console.error(e);
      console.error("\n");
    }
  }

}


global.describe = describe;
global.it   = test;
global.test = test;

// load and run test files
const files = process.argv.slice(2);
for (let i = 0; i < files.length; i++) {
  const it = files[i];
  state.currPath = it;
  const abs_path = it.startsWith('/') ? it : path.join(__dirname, it)
  const r = await import(abs_path);
  await run();
}
console.info("Passed: ", state.passed, ", Failed: ", state.failed);


