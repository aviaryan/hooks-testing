import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import useStaleRefresh from "./useStaleRefresh";

function fetchMock(url, suffix = "") {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve({
        json: () =>
          Promise.resolve({
            data: url + suffix,
          }),
      });
    }, 200 + Math.random() * 300)
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(cb, timeout = 500) {
  const step = 10;
  let timeSpent = 0;
  let timedOut = false;

  while (true) {
    try {
      await sleep(step);
      timeSpent += step;
      cb();
      break;
    } catch {}
    if (timeSpent >= timeout) {
      timedOut = true;
      break;
    }
  }

  if (timedOut) {
    throw new Error("timeout");
  }
}

beforeAll(() => {
  jest.spyOn(global, "fetch").mockImplementation(fetchMock);
});

afterAll(() => {
  global.fetch.mockClear();
});

let container = null;
beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  // cleanup on exiting
  unmountComponentAtNode(container);
  container.remove();
  container = null;
});

function renderHook(hook, args) {
  let result = {};

  function TestComponent({ hookArgs }) {
    result.current = hook(...hookArgs);
    return null;
  }

  function rerender(args) {
    act(() => {
      render(<TestComponent hookArgs={args} />, container);
    });
  }

  rerender(args);
  return { result, rerender };
}

it("useStaleRefresh hook runs correctly", async () => {
  const defaultValue = {
    data: "",
  };

  const { rerender, result } = renderHook(useStaleRefresh, [
    "url1",
    defaultValue,
  ]);
  expect(result.current[1]).toBe(true);

  await act(() =>
    waitFor(() => {
      expect(result.current[0].data).toBe("url1");
    })
  );

  rerender(["url2", defaultValue]);
  expect(result.current[1]).toBe(true);

  await act(() =>
    waitFor(() => {
      expect(result.current[0].data).toBe("url2");
    })
  );

  // new result
  global.fetch.mockImplementation((url) => fetchMock(url, "__"));

  // set url to url1 again
  rerender(["url1", defaultValue]);
  expect(result.current[0].data).toBe("url1");
  await act(() =>
    waitFor(() => {
      expect(result.current[0].data).toBe("url1__");
    })
  );

  // set url to url2 again
  rerender(["url2", defaultValue]);
  expect(result.current[0].data).toBe("url2");
  await act(() =>
    waitFor(() => {
      expect(result.current[0].data).toBe("url2__");
    })
  );
});
