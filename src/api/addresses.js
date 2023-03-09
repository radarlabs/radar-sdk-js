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
      unit // optional
    } = addressOptions;

    const params = {
      countryCode,
      stateCode,
      city,
      number,
      postalCode,
      street,
      unit
    };

    return Http.request('GET', 'addresses/validate', params);
  }
}

export default Addresses;
