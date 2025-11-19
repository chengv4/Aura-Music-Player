// common.js - 公共方法库
(function (global) {
  "use strict";

  // HTTP 客户端
  const httpClient = {
    async get(url, config = {}) {
      const { headers = {}, params = {} } = config;

      const urlObj = new URL(url);
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          urlObj.searchParams.append(key, params[key]);
        }
      });

      const response = await fetch(urlObj.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return { data: await response.json() };
      } else {
        return { data: await response.text() };
      }
    },

    async post(url, data, config = {}) {
      const { headers = {} } = config;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...headers,
        },
        body: data,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { data: await response.json() };
    },
  };

  // AES 加密实现
  async function aesEncrypt(text, key, iv) {
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(key);
    const ivBuffer = encoder.encode(iv);
    const textBuffer = encoder.encode(text);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-CBC" },
      false,
      ["encrypt"]
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: ivBuffer },
      cryptoKey,
      textBuffer
    );

    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  // RSA 加密实现（简化版，使用大整数运算）
  function rsaEncrypt(text, publicKey, modulus) {
    // 这里需要实现大整数运算，简化处理
    // 在实际应用中可能需要引入专门的大整数库
    const hexText = text
      .split("")
      .map((c) => c.charCodeAt(0).toString(16))
      .join("");

    // 简化的 RSA 加密，实际应用中需要更完整的实现
    try {
      const textNum = BigInt("0x" + hexText);
      const pubKey = BigInt("0x" + publicKey);
      const mod = BigInt("0x" + modulus);

      const result = modPow(textNum, pubKey, mod);
      const hexResult = result.toString(16);

      return "0".repeat(256 - hexResult.length) + hexResult;
    } catch (e) {
      console.warn("RSA encryption failed, using fallback");
      return text; // 降级处理
    }
  }

  // 大整数模幂运算
  function modPow(base, exponent, modulus) {
    if (modulus === 1n) return 0n;
    let result = 1n;
    base = base % modulus;
    while (exponent > 0n) {
      if (exponent % 2n === 1n) {
        result = (result * base) % modulus;
      }
      exponent = exponent >> 1n;
      base = (base * base) % modulus;
    }
    return result;
  }

  // 查询字符串处理
  const qs = {
    stringify: (obj) => {
      return Object.keys(obj)
        .map(
          (key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`
        )
        .join("&");
    },
  };

  // 日期处理
  const dayjs = {
    unix: (timestamp) => ({
      format: (format) => {
        const date = new Date(timestamp * 1000);
        if (format === "YYYY-MM-DD") {
          return date.toISOString().split("T")[0];
        }
        return date.toISOString();
      },
    }),
  };

  // DOM 解析
  function parseHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const $ = (selector) => {
      if (typeof selector === "string") {
        const elements = doc.querySelectorAll(selector);
        return {
          children: () => Array.from(elements[0]?.children || []),
          text: () => elements[0]?.textContent || "",
          attr: (name) => elements[0]?.getAttribute(name),
          find: (childSelector) => {
            const found = elements[0]?.querySelector(childSelector);
            return {
              attr: (name) => found?.getAttribute(name),
              text: () => found?.textContent || "",
            };
          },
          map: (callback) => {
            return Array.from(elements).map((el, index) => {
              return callback(index, el);
            });
          },
          toArray: () => Array.from(elements),
        };
      } else {
        // 处理元素对象
        return {
          text: () => selector.textContent || "",
          attr: (name) => selector.getAttribute(name),
          find: (childSelector) => {
            const found = selector.querySelector(childSelector);
            return {
              attr: (name) => found?.getAttribute(name),
              text: () => found?.textContent || "",
            };
          },
        };
      }
    };

    $.load = (html) => {
      const newDoc = parser.parseFromString(html, "text/html");
      return (selector) => {
        const elements = newDoc.querySelectorAll(selector);
        return {
          children: () => Array.from(elements[0]?.children || []),
          text: () => elements[0]?.textContent || "",
          attr: (name) => elements[0]?.getAttribute(name),
          find: (childSelector) => {
            const found = elements[0]?.querySelector(childSelector);
            return {
              attr: (name) => found?.getAttribute(name),
              text: () => found?.textContent || "",
            };
          },
        };
      };
    };

    return $;
  }

  // 导出公共方法
  const common = {
    httpClient,
    aesEncrypt,
    rsaEncrypt,
    qs,
    dayjs,
    parseHTML,
  };

  // 根据环境导出
  if (typeof module !== "undefined" && module.exports) {
    module.exports = common;
  } else if (typeof window !== "undefined") {
    window.MusicFreeCommon = common;
  } else {
    global.MusicFreeCommon = common;
  }
})(typeof window !== "undefined" ? window : this);
