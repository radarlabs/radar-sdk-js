import Config from "../config";
import Device from "../device";
import Http from "../http";
import Logger from "../logger";
import Session from "../session";
import Storage from "../storage";
import SDK_VERSION from "../version";

import type { RadarRevealRiskParams, RadarRevealRiskResponse } from "../types";

class RevealRiskAPI {
  /**
   * runs the reveal risk, to determine the risk of a user.
   * @param params - reveal risk parameters (user info, options)
   * @returns tracked user, and events
   */
  static async revealRisk(params: RadarRevealRiskParams) {
    const options = Config.get();

    // user indentification fields
    const userId = params.userId || Storage.getItem(Storage.USER_ID);
    const deviceId = params.deviceId || Device.getDeviceId();
    const installId = params.installId || Device.getInstallId();
    const sessionId = Session.getSessionId();
    const deviceType = params.deviceType || "Web";
    const description =
      params.description || Storage.getItem(Storage.DESCRIPTION);

    // save userId for trip tracking
    if (!userId) {
      Logger.warn("userId not provided for trackOnce.");
    } else {
      Storage.setItem(Storage.USER_ID, userId);
    }

    // other info
    const metadata = params.metadata || Storage.getJSON(Storage.METADATA);

    const body = {
      ...params,
      description,
      deviceId,
      deviceType,
      foreground: true,
      installId,
      sessionId,
      metadata,
      sdkVersion: SDK_VERSION,
      stopped: true,
      userId,
    };

    const response = await Http.request<
      Omit<RadarRevealRiskResponse, "response" | "reveal/risk">
    >({
      method: "POST",
      path: "track",
      data: body,
    });

    const { risk, network, device, id, token, expiresIn, expiresAt } = response;

    const revealRiskRes: RadarRevealRiskResponse = {
      id,
      token,
      expiresAt,
      expiresIn,
      risk,
      network,
      device,
    };

    if (options.debug) {
      revealRiskRes.response = response;
    }

    return revealRiskRes;
  }
}

export default RevealRiskAPI;
