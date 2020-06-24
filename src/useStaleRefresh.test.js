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
  expect(container.textContent).toBe("loading");

  await sleep(500);
  expect(container.textContent).toBe("url1");
});

// NOTE: why this? because other this object will change on every render
const defaultValue = { data: "" };

function TestComponent({ url }) {
  const [data, isLoading] = useStaleRefresh(url, defaultValue);
  if (isLoading) {
    return <div>loading</div>;
  }
  return <div>{data.data}</div>;
}
