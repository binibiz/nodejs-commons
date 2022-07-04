import LZUTF8 from "lzutf8";

import {
  ITraceHashData,
} from "./types";

//#####################################################
// Constants
//#####################################################
const TRACE_HASH_PREFIX = "$TRACE_HASH_";

//#####################################################
// Utilitary Functions
//#####################################################
/**
 * This function going to encode trace context data into
 * a hash.
 *
 * @param hashData - The context data to be encoded to hash.
 */
function hashEncode(
  hashData: ITraceHashData,
) {
  const base64Hash = LZUTF8.compress(JSON.stringify(hashData), {
    outputEncoding: "Base64",
  }) as string;

  return `${TRACE_HASH_PREFIX}${base64Hash}`;
}

/**
 * This function going to decode a hash into it's data.
 *
 * @param hash - The hash to be decoded.
 */
function hashDecode(
  hash: string,
) {
  const base64Hash = hash.replace(TRACE_HASH_PREFIX, "");

  const hashDataStr = LZUTF8.decompress(base64Hash, {
    inputEncoding: "Base64",
  });

  const hashData: ITraceHashData = JSON.parse(hashDataStr);

  return hashData;
}

//#####################################################
// Exports
//#####################################################
export {
  TRACE_HASH_PREFIX,
  hashDecode,
  hashEncode,
};
