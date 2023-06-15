import Config from '../config';
import Http from '../http';

import type { RadarValidateAddressParams, RadarValidateAddressResponse } from '../types';

class AddressesAPI {
  static async validateAddress(params: RadarValidateAddressParams): Promise<RadarValidateAddressResponse> {
    const options = Config.get();

    const response: any = await Http.request({
      method: 'GET',
      path: 'addresses/validate',
      data: params,
    });
    const { address, result } = response;

    const validateAddressRes = {
      address,
      result,
    } as RadarValidateAddressResponse;

    if (options.debug) {
      validateAddressRes.response = response;
    }

    return validateAddressRes;
  }
}

export default AddressesAPI;
