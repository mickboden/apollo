// Minimal argv parser: --flag value, --flag=value, boolean flags, repeatable (multi) flags, positionals.
export function parseArgs(argv, { string = [], boolean = [], multi = [] } = {}) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { positionals.push(a); continue; }
    const [name, inline] = a.slice(2).split(/=(.*)/s);
    if (boolean.includes(name)) flags[name] = true;
    else if (multi.includes(name)) (flags[name] ||= []).push(inline ?? argv[++i]);
    else if (string.includes(name)) flags[name] = inline ?? argv[++i];
    else throw new Error(`unknown flag --${name}`);
  }
  return { flags, positionals };
}
