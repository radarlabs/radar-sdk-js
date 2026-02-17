import RadarBase, * as exports from '.';

// Attach all error classes so CDN users can access them as Radar.RadarError, Radar.RadarBadRequestError, etc.
class Radar extends RadarBase {
  public static RadarError = exports.RadarError;
  public static RadarPublishableKeyError = exports.RadarPublishableKeyError;
  public static RadarLocationError = exports.RadarLocationError;
  public static RadarPermissionsError = exports.RadarPermissionsError;
  public static RadarBadRequestError = exports.RadarBadRequestError;
  public static RadarUnauthorizedError = exports.RadarUnauthorizedError;
  public static RadarPaymentRequiredError = exports.RadarPaymentRequiredError;
  public static RadarForbiddenError = exports.RadarForbiddenError;
  public static RadarNotFoundError = exports.RadarNotFoundError;
  public static RadarRateLimitError = exports.RadarRateLimitError;
  public static RadarServerError = exports.RadarServerError;
  public static RadarNetworkError = exports.RadarNetworkError;
  public static RadarUnknownError = exports.RadarUnknownError;
}

export default Radar;
