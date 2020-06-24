import { renderHook } from "@testing-library/react-hooks";
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

beforeAll(() => {
  jest.spyOn(global, "fetch").mockImplementation(fetchMock);
});

afterAll(() => {
  global.fetch.mockClear();
});

it("useStaleRefresh hook runs correctly", async () => {
  const defaultValue = { data: "" };

  const { result, wait, rerender } = renderHook(
    ({ url }) => useStaleRefresh(url, defaultValue),
    {
      initialProps: {
        url: "url1",
      },
    }
  );

  expect(result.current[0]).toEqual(defaultValue);
  expect(result.current[1]).toBe(true);

  await wait(() => {
    expect(result.current[0].data).toEqual("url1");
  });
  expect(result.current[1]).toBe(false);

  rerender({ url: "url2" });

  expect(result.current[0]).toEqual(defaultValue);
  expect(result.current[1]).toBe(true);

  await wait(() => {
    expect(result.current[0].data).toEqual("url2");
  });
  expect(result.current[1]).toBe(false);

  // new result
  global.fetch.mockImplementation((url) => fetchMock(url, "__"));

  // set url to url1 again
  rerender({ url: "url1" });
  expect(result.current[0].data).toEqual("url1");
  expect(result.current[1]).toBe(false);
  await wait(() => {
    expect(result.current[0].data).toEqual("url1__");
  });
  expect(result.current[1]).toBe(false);

  // set url to url2 again
  rerender({ url: "url2" });
  expect(result.current[0].data).toEqual("url2");
  expect(result.current[1]).toBe(false);
  await wait(() => {
    expect(result.current[0].data).toEqual("url2__");
  });
  expect(result.current[1]).toBe(false);
});
