// NOTE(jasonl): type overrides for local DX. intentionally in a .d.ts file so it doesn't bleed out into bundled types
interface Window {
  RADAR_TEST_ENV?: boolean;
}
