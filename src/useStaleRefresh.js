import { useState, useEffect } from "react";
const CACHE = {};

export default function useStaleRefresh(url, defaultValue = []) {
  const [data, setData] = useState(defaultValue);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    // cacheID is how a cache is identified against a unique request
    const cacheID = url;
    // look in cache and set response if present
    if (CACHE[cacheID] !== undefined) {
      setData(CACHE[cacheID]);
      setLoading(false);
    } else {
      // else make sure loading set to true
      setLoading(true);
      setData(defaultValue);
    }
    // fetch new data
    fetch(url)
      .then((res) => res.json())
      .then((newData) => {
        CACHE[cacheID] = newData;
        setData(newData);
        setLoading(false);
      });
  }, [url, defaultValue]);

  return [data, isLoading];
}
