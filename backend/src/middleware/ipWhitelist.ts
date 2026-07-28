import { Request, Response, NextFunction } from 'express';
import requestIp from 'request-ip';
import ipaddr from 'ipaddr.js';
import { getAdminIpWhitelist } from '../config/runtime';
import { createLogger } from '../lib/logger';

const logger = createLogger('middleware:ipWhitelist');

/**
 * Middleware to restrict access to specific IP addresses and CIDR ranges.
 * Supports IPv4 and IPv6, and handles proxy headers safely if the app is
 * configured to trust proxies.
 */
/**
 * Normalise an IP address by converting IPv4-mapped IPv6 addresses (::ffff:x.x.x.x)
 * to their plain IPv4 representation. This ensures that a client connecting via IPv6
 * with an IPv4-mapped address can still match IPv4 whitelist entries.
 */
function normaliseIp(rawIp: string): string {
  // Strip the IPv4-mapped IPv6 prefix if present
  const ipv4MappedPrefix = '::ffff:';
  if (rawIp.toLowerCase().startsWith(ipv4MappedPrefix)) {
    return rawIp.slice(ipv4MappedPrefix.length);
  }
  return rawIp;
}

export const ipWhitelistMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = requestIp.getClientIp(req);
  const whitelist = getAdminIpWhitelist();

  // Fail closed: an empty whitelist must not grant unrestricted access to the
  // sensitive admin/ops routes this middleware protects. Configure
  // ADMIN_IP_WHITELIST to allow trusted IPs through.
  if (whitelist.length === 0) {
    logger.warn(
      'ADMIN_IP_WHITELIST is not configured — blocking all requests to IP-restricted routes. ' +
        'Set ADMIN_IP_WHITELIST to a comma-separated list of allowed IPs/CIDR ranges to grant access.',
      { path: req.path, method: req.method },
    );
    return res.status(403).json({
      error: 'Access forbidden: IP whitelisting is not configured for this endpoint.',
    });
  }

  if (!clientIp) {
    logger.warn('Could not determine client IP for whitelisting', {
      path: req.path,
      method: req.method,
    });
    return res.status(403).json({ error: 'Access forbidden: Could not determine client IP' });
  }

  try {
    // Normalise the client IP to handle IPv4-mapped IPv6 addresses (e.g. ::ffff:192.168.1.1)
    const normalisedIp = normaliseIp(clientIp);
    const addr = ipaddr.parse(normalisedIp);
    const isAllowed = whitelist.some((entry) => {
      try {
        if (entry.includes('/')) {
          // CIDR range
          const [range, bits] = entry.split('/');
          const network = ipaddr.parse(range);
          const bitCount = parseInt(bits, 10);

          // Ensure both are same version (v4 or v6)
          if (addr.kind() === network.kind()) {
            return (addr as any).match(network, bitCount);
          }
          return false;
        } else {
          // Exact IP
          const allowedAddr = ipaddr.parse(entry);
          return addr.toString() === allowedAddr.toString();
        }
      } catch (err) {
        logger.error('Invalid entry in IP whitelist', {
          entry,
          error: err instanceof Error ? err.message : String(err),
        });
        return false;
      }
    });

    if (isAllowed) {
      return next();
    }

    logger.warn('Blocked unauthorized IP attempt', {
      ip: clientIp,
      path: req.path,
      method: req.method,
    });
  } catch (err) {
    logger.error('Error parsing client IP or checking whitelist', {
      ip: clientIp,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return res.status(403).json({
    error: 'Access forbidden: Your IP address is not authorized to access this endpoint.',
  });
};
