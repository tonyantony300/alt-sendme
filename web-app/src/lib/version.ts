// Single source of truth for version - reads from package.json
import packageJson from '../../package.json';

export const VERSION = packageJson.version;
export const VERSION_DISPLAY = `v${VERSION}`;

