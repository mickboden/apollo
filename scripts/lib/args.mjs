// Minimal argv parser: --flag value, --flag=value, boolean flags, positionals.
export function parseArgs(argv, { string = [], boolean = [] } = {}) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { positionals.push(a); continue; }
    const [name, inline] = a.slice(2).split(/=(.*)/s);
    if (boolean.includes(name)) flags[name] = true;
    else if (string.includes(name)) flags[name] = inline ?? argv[++i];
    else throw new Error(`unknown flag --${name}`);
  }
  return { flags, positionals };
}
