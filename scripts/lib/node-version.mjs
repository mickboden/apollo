// Kept tiny and syntax-plain so even an old Node can load it and print the message.
export const MIN_NODE = 22;

// null when fine, else a message. Node 22 is the first with a global WebSocket (used to talk to Chrome).
export function nodeProblem(version = process.version) {
  const major = Number(String(version).replace(/^v/, '').split('.')[0]);
  if (major >= MIN_NODE) return null;
  return 'Apollo needs Node ' + MIN_NODE + ' or newer (found ' + version + '). Install it from https://nodejs.org or with `nvm install ' + MIN_NODE + '`, then run the command again.';
}
