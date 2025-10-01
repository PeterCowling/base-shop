const globalState = globalThis.__OPENAI_FUNCTION_EXPORT__ || (globalThis.__OPENAI_FUNCTION_EXPORT__ = {});

function OpenAI(init) {
  if (typeof globalState.impl === "function") {
    return globalState.impl(init);
  }
  throw new Error("OpenAI implementation not set");
}

module.exports = OpenAI;
