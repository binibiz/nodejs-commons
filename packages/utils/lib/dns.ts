//#####################################################
// Imports
//#####################################################
import dns from "dns";

//#####################################################
// Types
//#####################################################
interface IUrlParts {
  host?: string;
  hostname?: string;
  origin?: string;
  password?: string;
  path?: string;
  port?: number;
  protocol?: string;
  user?: string;
  userinfo?: string;
}

interface IServiceUrl {
  hostname: string;
  port: number;
  host: string;
}

//#####################################################
// Methods
//#####################################################
/**
 * This function breaks an url into it's parts. By url
 * we mean somethig with the following schema.
 *
 * [protocol://user:password@hostname:port/path].
 *
 * @param url - The url to be broken.
 * @param opts - A set of options.
 * @param opts.port - A custom port number.
 */
function getUrlParts(
  url: string,
  opts: { port?: number } = {},
) {
  const result: IUrlParts = {
    host: null,
    hostname: null,
    origin: null,
    password: null,
    path: null,
    port: null,
    protocol: null,
    user: null,
    userinfo: null,
  };
  let parts = url.split("://");

  if (parts.length > 1) {
    result.protocol = parts.shift();
  }

  parts = parts[0].split("@");

  if (parts.length === 2) {
    result.userinfo = parts.shift();

    const userParts = result.userinfo.split(":");
    result.user = userParts.shift();
    result.password = userParts.length ? userParts.shift() : null;
  }

  parts = parts[0].split(":");

  if (parts.length === 2) {
    result.hostname = parts.shift();
    result.port = parseInt(parts.shift(), 10);
    result.host = `${result.hostname}:${result.port}`;
  }

  if (parts.length === 1) {
    result.hostname = parts.shift();

    if (opts.port) {
      result.port = opts.port;
      result.host = `${result.hostname}:${result.port}`;
    } else {
      result.host = result.hostname;
    }
  }

  result.origin = result.protocol ? `${result.protocol}://` : "";
  result.origin += result.hostname;
  result.origin += result.port ? `:${result.port}` : "";

  return result;
}

/**
 * This function resolves an url hostname to ip.
 *
 * @param url - The url to be resolved.
 * @param opts - A set of options.
 * @param opts.ignoredIps - List of ips to ignore.
 */
async function resolveUrlHostname(
  url: string,
  opts?: {
    ignoredIps?: string[];
  },
): Promise<IUrlParts> {
  return new Promise<IUrlParts>((resolve, reject) => {
    const urlParts = getUrlParts(url);

    dns.resolve4(urlParts.hostname, (error: any, ips: any) => {
      if (error) {
        return reject(error.message);
      } else if (ips.length === 0) {
        return reject(new Error("could not resolve hostname"));
      }

      let ip;

      // Try to find an non-ignored ip.
      if (opts && opts.ignoredIps) {
        for (let i = 0; i < ips.length; i++) {
          if (!opts.ignoredIps.find((ignoredIp) => ignoredIp === ips[i])) {
            ip = ips[i];
            break;
          }
        }

        // We could not find a suitable address.
        if (!ip) {
          return reject(new Error("coild not resolve hostname"));
        }
      } else {
        ip = ips[0];
      }

      urlParts.hostname = ip;

      const protocolPrefix = urlParts.protocol ? `${urlParts.protocol}://` : "";
      const portSuffix = urlParts.port ? `:${urlParts.port}` : "";
      urlParts.host = `${ip}${portSuffix}`;
      urlParts.origin = `${protocolPrefix}${urlParts.host}`;

      return resolve(urlParts);
    });
  });
}

/**
 * This function resolves a service port.
 *
 * @param url - The url to be resolved.
 */
async function resolveUrlPort(
  url: string,
): Promise<IUrlParts> {
  return new Promise<IUrlParts>((resolve, reject) => {
    const urlParts = getUrlParts(url);

    if (urlParts.port) {
      resolve(urlParts);
    } else {
      dns.resolveSrv(urlParts.hostname, (error: any, addrs: any) => {
        if (error) {
          return reject(error.message);
        } else if (addrs.length === 0) {
          return reject(new Error("service not found"));
        } else if (!addrs[0].port) {
          return reject(new Error("service port not found"));
        }

        const [addr] = addrs;
        urlParts.port = addr.port;
        urlParts.origin += `:${addr.port}`;
        urlParts.host += `:${addr.port}`;

        return resolve(urlParts);
      });
    }
  });
}

/**
 * This function resolves a service url.
 *
 * @deprecated In favor of resolveUrlPort and resolveUrlHostname
 *
 * @param url - The url to be resolved.
 */
async function resolveUrl(url: string): Promise<IUrlParts> {
  return new Promise<IUrlParts>((resolve, reject) => {
    const urlParts = getUrlParts(url);

    if (urlParts.port) {
      resolve(urlParts);
    } else {
      dns.resolveSrv(urlParts.hostname, (error: any, addrs: any) => {
        if (error) {
          return reject(error.message);
        } else if (addrs.length === 0) {
          return reject(new Error("service not found"));
        }

        const [addr] = addrs;
        urlParts.port = addr.port;
        urlParts.origin += `:${addr.port}`;
        urlParts.host += `:${addr.port}`;

        return resolve(urlParts);
      });
    }
  });
}

//#####################################################
// Export
//#####################################################
export {
  getUrlParts,
  IServiceUrl,
  IUrlParts,
  resolveUrl,
  resolveUrlHostname,
  resolveUrlPort,
};
