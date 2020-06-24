import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import useStaleRefresh from "./useStaleRefresh";

let result;

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

it("useStaleRefresh hook runs correctly", async () => {
  act(() => {
    render(<TestComponent url="url1" />, container);
  });
  expect(result[1]).toBe(true);

  await act(() =>
    waitFor(() => {
      expect(result[0].data).toBe("url1");
    })
  );

  act(() => {
    render(<TestComponent url="url2" />, container);
  });
  expect(result[1]).toBe(true);

  await act(() =>
    waitFor(() => {
      expect(result[0].data).toBe("url2");
    })
  );

  // new result
  global.fetch.mockImplementation((url) => fetchMock(url, "__"));

  // set url to url1 again
  act(() => {
    render(<TestComponent url="url1" />, container);
  });
  expect(result[0].data).toBe("url1");
  await act(() =>
    waitFor(() => {
      expect(result[0].data).toBe("url1__");
    })
  );

  // set url to url2 again
  act(() => {
    render(<TestComponent url="url2" />, container);
  });
  expect(result[0].data).toBe("url2");
  await act(() =>
    waitFor(() => {
      expect(result[0].data).toBe("url2__");
    })
  );
});

// NOTE: why this? because other this object will change on every render
const defaultValue = { data: "" };

function TestComponent({ url }) {
  result = useStaleRefresh(url, defaultValue);
  return null;
}
