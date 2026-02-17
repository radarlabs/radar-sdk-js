import Config from '../config';
import Http from '../http';

import type { RadarValidateAddressParams, RadarValidateAddressResponse } from '../types';

/** @internal address validation API — use {@link Radar.validateAddress} instead */
class AddressesAPI {
  /**
   * validate a structured address
   * @param params - address fields to validate
   * @returns validated address and verification result
   */
  static async validateAddress(params: RadarValidateAddressParams): Promise<RadarValidateAddressResponse> {
    const options = Config.get();

    const response = await Http.request<Omit<RadarValidateAddressResponse, 'response'>>({
      method: 'GET',
      path: 'addresses/validate',
      data: params,
    });
    const { address, result } = response;

    const validateAddressRes: RadarValidateAddressResponse = {
      address,
      result,
    };

    if (options.debug) {
      validateAddressRes.response = response;
    }

    return validateAddressRes;
  }
}

export default AddressesAPI;
