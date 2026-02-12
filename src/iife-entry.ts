import RadarBase, { RadarError } from '.';

// Any other non-type exports that we need to be able to access from other CDNs go here
class Radar extends RadarBase {
  public static RadarError = RadarError;
}

export default Radar;
