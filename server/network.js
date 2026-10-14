// Finds the laptop LAN address so the phone URL and QR code can be printed.
import os from 'node:os'

export function lanAddress() {
  const addrs = Object.values(os.networkInterfaces()).flat().filter((i) => i.family === 'IPv4' && !i.internal)
  return (addrs.find((i) => /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(i.address)) ?? addrs[0])?.address
}

// Where phones on the same network can reach the frontend (shown on token slips)
export function lanOrigin() {
  const ip = lanAddress()
  return ip ? `http://${ip}:${process.env.CLIENT_PORT || 5173}` : null
}
