export enum TrackOnceError {
  errorPublishableKey = 'ERROR_PUBLISHABLE_KEY',
  errorPermissions = 'ERROR_PERMISSIONS'
}

export type TrackOnceResult = {
  location: {
    accuracy: number;
    latitude: number;
    longitude: number;
  };
  user: {
    createdAt: string;
    updatedAt: string;
  };
};

export default class Radar {
  public static initialize(publishableKey: string): void;

  public static trackOnce(callbackFn: (err: null | TrackOnceError, result: TrackOnceResult) => void): void;
}