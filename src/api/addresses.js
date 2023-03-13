import Http from '../http';

class Addresses {
  static async validateAddress(addressOptions={}) {
    const {
      countryCode,
      stateCode,
      city,
      number,
      postalCode,
      street,
      unit,
      addressLabel,
    } = addressOptions;

    const params = {
      countryCode,
      stateCode,
      city,
      number,
      postalCode,
      street,
      unit,
      addressLabel,
    };

    return Http.request('GET', 'addresses/validate', params);
  }
}

export default Addresses;
